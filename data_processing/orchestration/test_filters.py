import os
import sys
import pandas as pd
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.utils.filter_engine import FilterEngine
from src.ingestion.cleaner import (
    remove_duplicates, handle_missing_values, 
    standardize_strings, remove_invalid_records
)
from src.features.analytical_filters import (
    filter_by_crime_category, generate_time_buckets, calculate_severity_score
)
from src.features.graph_filters import (
    identify_repeat_offenders, location_recurrence, co_occurrence_filter
)
from src.features.ml_filters import (
    time_window_flag, noise_flag_filter, hotspot_labeler, risk_labeler
)

def log_shape(func):
    """Decorator to log DataFrame shape after a filter runs."""
    def wrapper(df, *args, **kwargs):
        res = func(df, *args, **kwargs)
        logging.info(f"After {func.__name__} - Shape: {res.shape}")
        return res
    return wrapper

def main():
    csv_path = 'datasets/FIR_Details_Data.csv'
    if not os.path.exists(csv_path):
        logging.error(f"Dataset not found at {csv_path}")
        return

    logging.info("Loading raw data sample (10,000 rows)...")
    df_raw = pd.read_csv(csv_path, nrows=10000)
    logging.info(f"Raw shape: {df_raw.shape}")

    engine = FilterEngine(df_raw)

    # 1. Ingestion Layer
    engine.add_filters([
        log_shape(remove_duplicates),
        log_shape(handle_missing_values),
        log_shape(standardize_strings),
        log_shape(remove_invalid_records)
    ])
    
    # 2. Analytical Layer
    engine.add_filters([
        log_shape(generate_time_buckets),
        log_shape(calculate_severity_score)
    ])
    
    # 3. Graph Intelligence Layer
    engine.add_filters([
        log_shape(identify_repeat_offenders),
        log_shape(location_recurrence),
        log_shape(co_occurrence_filter)
    ])
    
    # 4. ML Layer
    engine.add_filters([
        log_shape(time_window_flag),
        log_shape(noise_flag_filter),
        log_shape(hotspot_labeler),
        log_shape(risk_labeler)
    ])

    logging.info("\nRunning multi-layer filtering engine...")
    df_processed = engine.run()
    
    logging.info(f"\nFinal Processed shape: {df_processed.shape}")
    
    logging.info("\n--- Severity Distribution ---")
    if 'Severity_Level' in df_processed.columns:
        logging.info(f"\n{df_processed['Severity_Level'].value_counts()}")
        
    logging.info("\n--- Hotspot Distribution ---")
    if 'Hotspot_Flag' in df_processed.columns:
        logging.info(f"\n{df_processed['Hotspot_Flag'].value_counts()}")

    logging.info("\n--- Sample Intelligence Features ---")
    columns_to_show = [
        'CrimeGroup_Name', 'Severity_Level', 'Predicted_Risk_Class', 
        'Location_Recurrence_Count', 'Hotspot_Flag', 'Syndicate_Link_Flag'
    ]
    existing_cols = [c for c in columns_to_show if c in df_processed.columns]
    print(df_processed[existing_cols].head(10))

if __name__ == "__main__":
    main()
