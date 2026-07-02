import pandas as pd

class DashboardAPI:
    """
    Operational filters exposing dynamic querying logic for the UI.
    """
    
    @staticmethod
    def filter_by_crime_type(df: pd.DataFrame, crime_type: str) -> pd.DataFrame:
        if 'CrimeGroup_Name' in df.columns:
            return df[df['CrimeGroup_Name'].str.contains(crime_type, case=False, na=False)]
        return df
        
    @staticmethod
    def drill_down_district(df: pd.DataFrame, district: str, station: str = None) -> pd.DataFrame:
        filtered = df
        if 'District_Name' in df.columns:
            filtered = filtered[filtered['District_Name'].str.upper() == district.upper()]
        if station and 'UnitName' in filtered.columns:
            filtered = filtered[filtered['UnitName'].str.upper() == station.upper()]
        return filtered

    @staticmethod
    def filter_by_risk_level(df: pd.DataFrame, risk_level: str) -> pd.DataFrame:
        if 'Severity_Level' in df.columns:
            return df[df['Severity_Level'].str.upper() == risk_level.upper()]
        return df

    @staticmethod
    def get_hotspots_only(df: pd.DataFrame) -> pd.DataFrame:
        if 'Target_IsHotspot' in df.columns:
            return df[df['Target_IsHotspot'] == 1]
        return df
