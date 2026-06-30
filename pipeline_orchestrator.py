from data_generation import generate_all_mock_firs
from data_processing import load_all_firs, aggregate_datasets, train_classifier, classify_and_filter
from database_operations import (
    init_db,
    get_session,
    upsert_stations,
    upsert_firs,
    upsert_filtered_crimes,
)
from config import MOCK_STATIONS


def run_pipeline(generate_mock=False):
    print()
    print("=" * 60)
    print("  CRIME DATA PIPELINE")
    print("=" * 60)

    # Step 0: Generate mock FIR data if requested
    if generate_mock:
        print("\n[1/5] Generating mock FIR datasets...")
        generate_all_mock_firs()
    else:
        print("\n[1/5] Skipping mock generation (use --generate-mock or --all)")

    # Step 1: Load data
    print("\n[2/5] Loading FIR datasets...")
    dataframes = load_all_firs()

    # Step 2: Aggregate
    print("\n[3/5] Aggregating datasets into unified stream...")
    combined = aggregate_datasets(dataframes)

    # Step 3: Classify & filter
    print("\n[4/5] Training ML classifier & filtering records...")
    pipeline = train_classifier()
    filtered, discarded = classify_and_filter(pipeline, combined)

    # Step 4: Store results in database
    print("\n[5/5] Storing filtered records in central database...")
    init_db()
    session = get_session()
    try:
        station_map = upsert_stations(session, MOCK_STATIONS)

        combined_with_sid = combined.copy()
        combined_with_sid["station_id"] = combined_with_sid["station_name"].map(
            station_map
        )

        fir_ids, new_fir_count = upsert_firs(session, combined_with_sid)

        inserted = upsert_filtered_crimes(session, filtered, fir_ids)

        print(f"  [+] Stations: {len(station_map)} ready")
        print(f"  [+] FIRs: {new_fir_count} newly inserted")
        print(f"  [+] Filtered crimes: {inserted} newly stored")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

    print()
    print("=" * 60)
    print("  PIPELINE COMPLETE")
    print("=" * 60)
    print()
