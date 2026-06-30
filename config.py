import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'crime_pipeline.db')}"

DATA_DIR = os.path.join(BASE_DIR, "data", "firs")
LABELED_DATA_PATH = os.path.join(BASE_DIR, "data", "labeled_crimes.csv")

TARGET_CATEGORIES = [
    "Violent",
    "Financial",
    "Cyber",
    "Property",
    "Drug-related",
]

MOCK_STATIONS = [
    {"name": "Central Police Station", "jurisdiction": "Downtown", "city": "Mumbai"},
    {"name": "Sector 12 Police Station", "jurisdiction": "Sector 12", "city": "Delhi"},
    {"name": "Cyber Crime Police Station", "jurisdiction": "Whitefield", "city": "Bangalore"},
]

MOCK_RECORDS_PER_STATION = 100
