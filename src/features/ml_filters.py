import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN

def time_window_flag(df: pd.DataFrame, years: int = 10) -> pd.DataFrame:
    """Flags records older than N years instead of destructively filtering them."""
    if 'FIR_YEAR' in df.columns:
        # Assuming current year is 2026
        current_year = 2026
        min_year = current_year - years
        df['Is_Historical_Archive'] = (df['FIR_YEAR'] < min_year).astype(int)
    return df

def noise_flag_filter(df: pd.DataFrame) -> pd.DataFrame:
    """Flags noisy records rather than dropping them."""
    if 'CrimeGroup_Name' in df.columns:
        df['Is_Noisy_Record'] = df['CrimeGroup_Name'].isna().astype(int)
    return df

def hotspot_labeler(df: pd.DataFrame) -> pd.DataFrame:
    """
    Labels data for hotspot classification using a hybrid approach:
    1. Tries DBSCAN clustering if valid Latitude/Longitude exists.
    2. Falls back to strict 95th-percentile Location Recurrence clustering.
    Target: 1 if location is a hotspot, else 0.
    """
    df['Hotspot_Flag'] = 0
    
    # Attempt Spatial Clustering (DBSCAN) if coords are mostly valid
    has_coords = 'Latitude' in df.columns and 'Longitude' in df.columns
    if has_coords:
        valid_coords = df[(df['Latitude'] != 0.0) & (df['Longitude'] != 0.0)]
        if len(valid_coords) > 100:
            # Simple DBSCAN on coordinates (eps=0.01 roughly 1km, min_samples=10)
            coords = valid_coords[['Latitude', 'Longitude']].values
            clusterer = DBSCAN(eps=0.01, min_samples=10).fit(coords)
            
            # -1 means noise (not a hotspot cluster)
            valid_coords_mask = clusterer.labels_ != -1
            
            # Map back to main dataframe
            hotspot_indices = valid_coords.index[valid_coords_mask]
            df.loc[hotspot_indices, 'Hotspot_Flag'] = 1
            return df
            
    # Fallback to Statistical Frequency if coordinates are invalid or DBSCAN didn't trigger
    if 'Location_Recurrence_Count' in df.columns:
        threshold = df['Location_Recurrence_Count'].quantile(0.95)
        # Ensure threshold is meaningful (at least 3 recurrences)
        threshold = max(threshold, 3) 
        df['Hotspot_Flag'] = (df['Location_Recurrence_Count'] >= threshold).astype(int)
        
    return df

def risk_labeler(df: pd.DataFrame) -> pd.DataFrame:
    """
    Maps Severity_Level to a numeric target classification label.
    0: Low, 1: High, 2: Critical
    """
    if 'Severity_Level' in df.columns:
        mapping = {'LOW': 0, 'HIGH': 1, 'CRITICAL': 2, 'UNKNOWN': 0}
        df['Predicted_Risk_Class'] = df['Severity_Level'].map(mapping)
    return df
