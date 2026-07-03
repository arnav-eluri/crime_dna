import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'data', 'crime_pipeline.db')}"

DATA_DIR = os.path.join(BASE_DIR, "data", "firs")
LABELED_DATA_PATH = os.path.join(BASE_DIR, "data", "labeled_crimes.csv")
SUMMARY_OUTPUT_PATH = os.path.join(BASE_DIR, "data", "03_processed", "dashboard_summary.json")
RAW_DATASET_PATH = os.path.join(BASE_DIR, "datasets", "FIR_Details_Data.csv")
STAGING_DB_PATH = os.path.join(BASE_DIR, "data", "02_staging", "crime_pipeline_test.db")
SCHEMA_PATH = os.path.join(BASE_DIR, "src", "loaders", "schema.sql")

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
