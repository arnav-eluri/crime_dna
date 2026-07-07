import sqlite3
import pandas as pd
import os

DB_FILE = 'data/02_staging/crime_pipeline_test.db'
SCHEMA_FILE = 'src/loaders/schema.sql'
CSV_FILE = 'datasets/FIR_Details_Data.csv'

def setup_db(conn):
    with open(SCHEMA_FILE, 'r') as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    conn.commit()

def ingest_data(conn, limit=None):
    print(f"Reading {f'up to {limit} rows' if limit else 'all rows'} from {CSV_FILE}...")
    df = pd.read_csv(CSV_FILE, nrows=limit)
    cursor = conn.cursor()

    # We will use dictionaries to cache lookups and get their IDs
    district_cache = {}
    unit_cache = {}
    employee_cache = {}
    crime_head_cache = {}
    case_status_cache = {}

    for idx, row in df.iterrows():
        # 1. District
        district_name = str(row.get('District_Name', 'Unknown'))
        if district_name not in district_cache:
            cursor.execute("INSERT INTO District (DistrictName) VALUES (?)", (district_name,))
            district_cache[district_name] = cursor.lastrowid
        dist_id = district_cache[district_name]

        # 2. Unit (Police Station)
        unit_name = str(row.get('UnitName', 'Unknown'))
        if unit_name not in unit_cache:
            cursor.execute("INSERT INTO Unit (UnitName, DistrictID) VALUES (?, ?)", (unit_name, dist_id))
            unit_cache[unit_name] = cursor.lastrowid
        unit_id = unit_cache[unit_name]

        # 3. Employee (IO)
        io_name = str(row.get('IOName', 'Unknown'))
        kgid = str(row.get('KGID', ''))
        if io_name not in employee_cache:
            cursor.execute("INSERT INTO Employee (FirstName, KGID, UnitID, DistrictID) VALUES (?, ?, ?, ?)", 
                           (io_name, kgid, unit_id, dist_id))
            employee_cache[io_name] = cursor.lastrowid
        emp_id = employee_cache[io_name]

        # 4. Crime Head
        crime_head = str(row.get('CrimeHead_Name', 'Unknown'))
        crime_group = str(row.get('CrimeGroup_Name', 'Unknown'))
        if crime_head not in crime_head_cache:
            cursor.execute("INSERT INTO CrimeHead (CrimeGroupName) VALUES (?)", (crime_group,))
            ch_id = cursor.lastrowid
            cursor.execute("INSERT INTO CrimeSubHead (CrimeHeadID, CrimeHeadName) VALUES (?, ?)", (ch_id, crime_head))
            crime_head_cache[crime_head] = (ch_id, cursor.lastrowid)
        major_head_id, minor_head_id = crime_head_cache[crime_head]

        # 5. Case Status
        fir_stage = str(row.get('FIR_Stage', 'Unknown'))
        if fir_stage not in case_status_cache:
            cursor.execute("INSERT INTO CaseStatusMaster (CaseStatusName) VALUES (?)", (fir_stage,))
            case_status_cache[fir_stage] = cursor.lastrowid
        status_id = case_status_cache[fir_stage]

        # 6. CaseMaster
        brief_facts = str(row.get('Place of Offence', ''))
        lat = row.get('Latitude', 0.0)
        lon = row.get('Longitude', 0.0)
        
        cursor.execute("""
            INSERT INTO CaseMaster (
                PoliceStationID, PolicePersonID, CrimeMajorHeadID, CrimeMinorHeadID, CaseStatusID, 
                BriefFacts, latitude, longitude
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (unit_id, emp_id, major_head_id, minor_head_id, status_id, brief_facts, lat, lon))
        case_id = cursor.lastrowid

        # 7. Victims
        # Generating fake victims based on the VICTIM COUNT
        victim_count = 0
        try:
            victim_count = int(row.get('VICTIM COUNT', 0))
        except ValueError:
            pass
        
        for v in range(victim_count):
            cursor.execute("INSERT INTO Victim (CaseMasterID, VictimName) VALUES (?, ?)", (case_id, f"Victim {v+1}"))

        # 8. Accused
        accused_count = 0
        try:
            accused_count = int(row.get('Accused Count', 0))
        except ValueError:
            pass
            
        for a in range(accused_count):
            cursor.execute("INSERT INTO Accused (CaseMasterID, AccusedName) VALUES (?, ?)", (case_id, f"Accused {a+1}"))

    conn.commit()
    print("Ingestion complete.")
    
    # Run a test query
    cursor.execute("SELECT COUNT(*) FROM CaseMaster")
    case_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM Victim")
    victim_tot = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM Accused")
    accused_tot = cursor.fetchone()[0]
    
    print(f"Total Cases inserted: {case_count}")
    print(f"Total Victims inserted: {victim_tot}")
    print(f"Total Accused inserted: {accused_tot}")

if __name__ == '__main__':
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
    
    conn = sqlite3.connect(DB_FILE)
    print("Setting up database schema...")
    setup_db(conn)
    print("Starting ingestion...")
    ingest_data(conn, limit=None)
    conn.close()
