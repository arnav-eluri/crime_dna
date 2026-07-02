import pandas as pd
import numpy as np
import datetime

def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """Removes EXPLICIT exact duplicates only. Prevents dropping records missing FIRNo."""
    # Only drop if the entire row is exactly duplicated to prevent data loss
    return df.drop_duplicates()

def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """Handles null values in critical fields via imputation."""
    if 'Latitude' in df.columns and 'Longitude' in df.columns:
        df['Latitude'] = pd.to_numeric(df['Latitude'], errors='coerce').fillna(0.0)
        df['Longitude'] = pd.to_numeric(df['Longitude'], errors='coerce').fillna(0.0)
        
    if 'BriefFacts' in df.columns:
        df['BriefFacts'] = df['BriefFacts'].fillna("Unknown")
        
    if 'Place of Offence' in df.columns:
        df['Place of Offence'] = df['Place of Offence'].fillna("Unknown Location")
        
    return df

def standardize_strings(df: pd.DataFrame) -> pd.DataFrame:
    """Standardizes string formats without dropping rows."""
    string_cols = df.select_dtypes(include=['object']).columns
    for col in string_cols:
        df[col] = df[col].astype(str).str.strip().str.upper()
    return df

def remove_invalid_records(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fixes logically invalid records (negative counts, future years) 
    via clipping and median imputation instead of row dropping.
    """
    # Fix future years by imputing to median year
    if 'FIR_YEAR' in df.columns:
        current_year = datetime.datetime.now().year
        df['FIR_YEAR'] = pd.to_numeric(df['FIR_YEAR'], errors='coerce')
        median_year = df['FIR_YEAR'][df['FIR_YEAR'] <= current_year].median()
        
        # Clamp future years or NaNs to the median year
        df.loc[df['FIR_YEAR'] > current_year, 'FIR_YEAR'] = median_year
        df['FIR_YEAR'] = df['FIR_YEAR'].fillna(median_year)
        
    # Clamp negative counts to 0
    count_cols = ['VICTIM COUNT', 'Accused Count', 'Arrested Male', 'Arrested Female']
    for col in count_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            df[col] = df[col].clip(lower=0)
            
    return df
