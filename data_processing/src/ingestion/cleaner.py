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
        
        # Impute missing coordinates for other districts to show on map
        district_coords = {
            'BENGALURU DIST': (13.2, 77.6),
            'TUMAKURU': (13.3392, 77.1016),
            'SHIVAMOGGA': (13.9299, 75.5681),
            'MANDYA': (12.5218, 76.8951),
            'BELAGAVI DIST': (15.8497, 74.4977),
            'HASSAN': (13.0072, 76.1016),
            'MYSURU DIST': (12.2958, 76.6394),
            'CHITRADURGA': (14.2251, 76.3980),
            'RAMANAGARA': (12.7150, 77.2811),
            'VIJAYAPUR': (16.8302, 75.7100),
            'DAVANAGERE': (14.4644, 75.9218),
            'BIDAR': (17.9104, 77.5199),
            'CHICKBALLAPURA': (13.4325, 77.7275),
            'RAICHUR': (16.2076, 77.3463),
            'CHIKKAMAGALURU': (13.3161, 75.7720),
            'UTTARA KANNADA': (14.8055, 74.6859),
            'MANGALURU CITY': (12.9141, 74.8560),
            'KALABURAGI': (17.3297, 76.8343),
            'MYSURU CITY': (12.3050, 76.6400),
            'HAVERI': (14.7937, 75.3995),
            'UDUPI': (13.3409, 74.7421),
            'BALLARI': (15.1394, 76.9214),
            'BAGALKOT': (16.1817, 75.6958),
            'VIJAYANAGARA': (15.2750, 76.3900),
            'KOPPAL': (15.3501, 76.1557),
            'HUBBALLI DHARWAD CITY': (15.3647, 75.1240),
            'KOLAR': (13.1367, 78.1292),
            'CHAMARAJANAGAR': (11.9261, 76.9406),
            'DAKSHINA KANNADA': (12.8687, 75.2483),
            'BELAGAVI CITY': (15.8500, 74.5000),
            'KALABURAGI CITY': (17.3300, 76.8350),
            'YADGIR': (16.7648, 77.1404),
            'KODAGU': (12.3375, 75.8069),
            'GADAG': (15.4300, 75.6318),
            'DHARWAD': (15.4589, 75.0078),
        }
        
        if 'District_Name' in df.columns:
            mask = (df['Latitude'] == 0.0) | (df['Longitude'] == 0.0)
            
            def get_lat(row):
                if pd.isna(row['District_Name']): return 0.0
                dist = str(row['District_Name']).strip().upper()
                return district_coords.get(dist, (0.0, 0.0))[0] + np.random.normal(0, 0.05)
                
            def get_lng(row):
                if pd.isna(row['District_Name']): return 0.0
                dist = str(row['District_Name']).strip().upper()
                return district_coords.get(dist, (0.0, 0.0))[1] + np.random.normal(0, 0.05)
                
            if mask.any():
                imputed_lats = df[mask].apply(get_lat, axis=1)
                imputed_lngs = df[mask].apply(get_lng, axis=1)
                df.loc[mask, 'Latitude'] = imputed_lats
                df.loc[mask, 'Longitude'] = imputed_lngs
                
                # Zero out any that didn't match a district
                df.loc[df['Latitude'] < 10, 'Latitude'] = 0.0
                df.loc[df['Longitude'] < 70, 'Longitude'] = 0.0
        
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
