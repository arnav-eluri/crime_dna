import csv
import os
import random
from datetime import datetime, timedelta

from src.ingestion.filtering.config import DATA_DIR, MOCK_STATIONS, MOCK_RECORDS_PER_STATION

CRIME_TEMPLATES = {
    "Violent": [
        "Armed robbery at {location} involving a firearm, loot worth {amount}",
        "Physical assault reported near {location}, victim sustained injuries",
        "Homicide investigation at {location}, body discovered in the morning",
        "Kidnapping of a {age}-year-old near {location}, ransom demand received",
        "Street fight escalated into grievous hurt at {location}, {n} persons arrested",
        "Attempted murder case filed, victim attacked with a sharp weapon at {location}",
        "Dacoity at {location}, group of {n} individuals looted the premises",
        "Extortion threat received by shopkeeper at {location}, demanded {amount}",
        "Chain snatching incident at {location}, accused fled on motorcycle",
        "Domestic violence complaint registered by victim at {location}",
    ],
    "Financial": [
        "Bank fraud of {amount} detected at {location}, account compromised",
        "Ponzi scheme worth {amount} uncovered in {location}, {n} investors affected",
        "Cheque bouncing case filed for amount {amount} at {location}",
        "Credit card fraud of {amount} reported from {location}",
        "Insurance fraud investigation launched at {location}, false claim of {amount}",
        "Money laundering operation busted at {location}, {amount} seized",
        "Forgery of financial documents at {location}, fake signatures detected",
        "Loan default fraud of {amount} reported at {location}",
        "Cryptocurrency scam worth {amount} at {location}, {n} victims identified",
        "Embezzlement of company funds amounting to {amount} at {location}",
    ],
    "Cyber": [
        "Phishing attack targeted employees at {location}, credentials stolen",
        "Ransomware attack on systems at {location}, demand of {amount} in Bitcoin",
        "Identity theft reported from {location}, social media accounts hacked",
        "Online banking fraud of {amount} via phishing link sent to {location}",
        "Cyber stalking case filed by victim residing at {location}",
        "Data breach at {location}, {n} customer records compromised",
        "Unauthorized network intrusion detected at {location}",
        "Fake online store fraud, victims lost {amount}, operated from {location}",
        "Social engineering scam at {location}, {amount} transferred fraudulently",
        "SIM swapping fraud reported at {location}, bank accounts drained of {amount}",
    ],
    "Property": [
        "Burglary at {location}, valuables worth {amount} stolen",
        "Housebreaking at {location}, {n} suspects entered during daytime",
        "Vehicle theft reported from {location}, car valued at {amount}",
        "Vandalism of public property at {location}, estimated damage {amount}",
        "Trespassing complaint filed at {location}, suspect identified",
        "Storehouse theft of goods worth {amount} at {location}",
        "Bicycle theft from {location}, CCTV footage under review",
        "Office break-in at {location}, electronics worth {amount} stolen",
        "Jewelry theft from residence at {location}, valuables worth {amount}",
        "Construction material theft from site at {location}, loss of {amount}",
    ],
    "Drug-related": [
        "Drug trafficking ring busted at {location}, {n} kg of contraband seized",
        "Possession of narcotics found on suspect at {location}, {amount} worth",
        "Illegal drug manufacturing lab discovered at {location}",
        "MDMA seizure of {n} tablets at {location}, {n} persons arrested",
        "Cocaine trafficking via courier, package intercepted at {location}",
        "Ganja cultivation discovered in farmland near {location}",
        "Pharmaceutical drug abuse case at {location}, {n} injections seized",
        "Drug peddling near school zone at {location}, {n} juveniles involved",
        "Smuggling of controlled substances across border near {location}",
        "Fatal overdose case investigated at {location}, substance identified",
    ],
}

LOCATIONS = [
    "Main Road",
    "Market Square",
    "Railway Station",
    "Bus Terminal",
    "Industrial Area",
    "Residential Colony",
    "Shopping Mall",
    "School Zone",
    "Hospital Road",
    "Temple Street",
]

AMOUNTS = [
    "Rs.50,000",
    "Rs.2,00,000",
    "Rs.10,00,000",
    "Rs.25,000",
    "Rs.5,00,000",
    "Rs.1,00,000",
    "Rs.75,000",
]

AGES = [25, 30, 35, 40, 45]
NUMS = [2, 3, 4, 5, 6]

FIR_STATUSES = ["Open", "Under Investigation", "Closed", "Pending Review"]


def generate_firs_for_station(station_name, station_index, count=None):
    if count is None:
        count = MOCK_RECORDS_PER_STATION
    records = []
    base_date = datetime.now() - timedelta(days=365)

    for i in range(count):
        category = random.choice(list(CRIME_TEMPLATES.keys()))
        template = random.choice(CRIME_TEMPLATES[category])

        description = template.format(
            location=random.choice(LOCATIONS),
            amount=random.choice(AMOUNTS),
            age=random.choice(AGES),
            n=random.choice(NUMS),
        )

        crime_date = base_date + timedelta(
            days=random.randint(0, 365),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
        )

        records.append(
            {
                "fir_number": f"FIR-{station_index:03d}-{i+1:04d}",
                "date_reported": crime_date.strftime("%Y-%m-%d"),
                "crime_time": crime_date.strftime("%H:%M"),
                "description": description,
                "status": random.choice(FIR_STATUSES),
                "station_name": station_name,
            }
        )

    return records


def generate_all_mock_firs():
    os.makedirs(DATA_DIR, exist_ok=True)

    total = 0
    for idx, station in enumerate(MOCK_STATIONS, start=1):
        records = generate_firs_for_station(station["name"], idx)
        filename = f"{station['name'].replace(' ', '_').lower()}.csv"
        filepath = os.path.join(DATA_DIR, filename)

        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "fir_number",
                    "date_reported",
                    "crime_time",
                    "description",
                    "status",
                    "station_name",
                ],
            )
            writer.writeheader()
            writer.writerows(records)

        total += len(records)
        print(f"  [+] {filename} ({len(records)} records)")

    print(f"  [>] {total} total mock records written to {DATA_DIR}")
    return DATA_DIR
