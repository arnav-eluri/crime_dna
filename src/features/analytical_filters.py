import pandas as pd
import numpy as np

def filter_by_crime_category(df: pd.DataFrame, target_categories: list = None) -> pd.DataFrame:
    """Filters data for specific crime categories (e.g., 'THEFT', 'ASSAULT')."""
    if target_categories and 'CrimeGroup_Name' in df.columns:
        targets = [str(c).upper() for c in target_categories]
        return df[df['CrimeGroup_Name'].isin(targets)]
    return df

def generate_time_buckets(df: pd.DataFrame) -> pd.DataFrame:
    """Creates year, month, and day buckets for time-series aggregation."""
    if 'FIR_YEAR' in df.columns and 'FIR_MONTH' in df.columns:
        # Fill missing with 01 to prevent NaN propagation
        df['FIR_MONTH_CLEAN'] = df['FIR_MONTH'].replace(np.nan, '01').astype(str).str.zfill(2)
        df['TimeBucket_YYYYMM'] = df['FIR_YEAR'].astype(str).apply(lambda x: x.split('.')[0]) + "-" + df['FIR_MONTH_CLEAN']
        df.drop(columns=['FIR_MONTH_CLEAN'], inplace=True)
    return df

def filter_by_geography(df: pd.DataFrame, district: str = None) -> pd.DataFrame:
    """Filters by specific district or geographic bounds."""
    if district and 'District_Name' in df.columns:
        return df[df['District_Name'] == district.upper()]
    return df

def calculate_severity_score(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates a severity score and categorizes risk using a strict weighted matrix.
    Formula: severity_score = IPC_weight + (victim_count * 2) + (accused_count * 1)
    """
    if 'VICTIM COUNT' not in df.columns or 'Accused Count' not in df.columns or 'CrimeGroup_Name' not in df.columns:
        return df
        
    def get_ipc_weight(crime_grp):
        cg = str(crime_grp).upper()
        if any(x in cg for x in ['MURDER', 'POCSO', 'RAPE', 'DACOITY', 'TERROR', 'KIDNAPPING']):
            return 10
        elif any(x in cg for x in ['ROBBERY', 'NDPS', 'ARMS ACT', 'EXTORTION', 'RIOT']):
            return 7
        elif any(x in cg for x in ['THEFT', 'CHEATING', 'CYBER', 'FRAUD', 'BURGLARY']):
            return 4
        elif any(x in cg for x in ['TRAFFIC', 'EXCISE', 'GAMBLING']):
            return 1
        return 2

    # Vectorized scoring
    ipc_weights = df['CrimeGroup_Name'].apply(get_ipc_weight)
    victims = pd.to_numeric(df['VICTIM COUNT'], errors='coerce').fillna(0)
    accused = pd.to_numeric(df['Accused Count'], errors='coerce').fillna(0)
    
    df['Severity_Score'] = ipc_weights + (victims * 2) + (accused * 1)
    
    # Bucket into categories
    conditions = [
        (df['Severity_Score'] >= 12),
        (df['Severity_Score'] >= 7) & (df['Severity_Score'] < 12),
        (df['Severity_Score'] < 7)
    ]
    choices = ['CRITICAL', 'HIGH', 'LOW']
    df['Severity_Level'] = np.select(conditions, choices, default='LOW')
    
    return df
