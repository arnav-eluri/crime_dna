from datetime import date
from sqlalchemy import create_engine, Column, Integer, String, Date, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.sql import func

from filtering.config import DATABASE_URL

Base = declarative_base()


class Station(Base):
    __tablename__ = "station"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    jurisdiction = Column(String(200))
    city = Column(String(100))

    firs = relationship("Fir", back_populates="station", cascade="all, delete-orphan")


class Fir(Base):
    __tablename__ = "fir"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(Integer, ForeignKey("station.id"), nullable=False)
    fir_number = Column(String(50), nullable=False)
    date_reported = Column(Date, nullable=False)
    crime_time = Column(String(50))
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Open")
    source_file = Column(String(200))

    station = relationship("Station", back_populates="firs")
    filtered = relationship("FilteredCrime", back_populates="fir", uselist=False, cascade="all, delete-orphan")


class FilteredCrime(Base):
    __tablename__ = "filtered_crime"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fir_id = Column(Integer, ForeignKey("fir.id"), nullable=False, unique=True)
    category = Column(String(100), nullable=False)
    confidence = Column(Float)
    filter_date = Column(DateTime, server_default=func.now())

    fir = relationship("Fir", back_populates="filtered")


engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine)


def init_db():
    Base.metadata.create_all(engine)


def get_session():
    return SessionLocal()


def upsert_stations(session, stations_data):
    station_map = {}
    for sd in stations_data:
        existing = session.query(Station).filter_by(name=sd["name"]).first()
        if not existing:
            existing = Station(**sd)
            session.add(existing)
            session.flush()
        station_map[existing.name] = existing.id
    session.commit()
    return station_map


def upsert_firs(session, df):
    fir_ids = {}
    count = 0
    for _, row in df.iterrows():
        existing = session.query(Fir).filter_by(fir_number=row["fir_number"]).first()
        if existing:
            fir_ids[row["fir_number"]] = existing.id
            continue
        station_id = row.get("station_id")
        if station_id is None:
            continue
        raw_date = row["date_reported"]
        if isinstance(raw_date, str):
            parsed_date = date.fromisoformat(raw_date)
        else:
            parsed_date = raw_date

        fir = Fir(
            station_id=station_id,
            fir_number=row["fir_number"],
            date_reported=parsed_date,
            crime_time=str(row.get("crime_time") or ""),
            description=row["description"],
            status=row.get("status", "Open"),
            source_file=row.get("source_file"),
        )
        session.add(fir)
        session.flush()
        fir_ids[row["fir_number"]] = fir.id
        count += 1
    session.commit()
    return fir_ids, count


def upsert_filtered_crimes(session, df, fir_ids):
    count = 0
    for _, row in df.iterrows():
        fir_id = fir_ids.get(row["fir_number"])
        if fir_id is None:
            continue
        existing = session.query(FilteredCrime).filter_by(fir_id=fir_id).first()
        if existing:
            continue
        session.add(
            FilteredCrime(
                fir_id=fir_id,
                category=row["predicted_category"],
                confidence=float(row["confidence"]),
            )
        )
        count += 1
    session.commit()
    return count
