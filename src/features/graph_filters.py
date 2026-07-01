import pandas as pd

def identify_repeat_offenders(df: pd.DataFrame) -> pd.DataFrame:
    """
    Identifies potential syndicate links if multiple accused are frequently present.
    """
    if 'Accused Count' in df.columns:
        df['Syndicate_Link_Flag'] = (df['Accused Count'] >= 3).astype(int)
    else:
        df['Syndicate_Link_Flag'] = 0
    return df

def location_recurrence(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes frequency of crimes happening at the exact same location string 
    as a baseline for statistical density when coordinates are missing.
    """
    if 'Place of Offence' in df.columns:
        # Group by district and place to prevent cross-district string collisions
        if 'District_Name' in df.columns:
            group_key = df['District_Name'].astype(str) + "_" + df['Place of Offence'].astype(str)
        else:
            group_key = df['Place of Offence'].astype(str)
            
        location_counts = group_key.value_counts()
        df['Location_Recurrence_Count'] = group_key.map(location_counts).fillna(1)
    return df

def co_occurrence_filter(df: pd.DataFrame) -> pd.DataFrame:
    """
    Identifies FIRs with same suspect profiles (e.g. same crime group + same district).
    """
    if 'CrimeGroup_Name' in df.columns and 'District_Name' in df.columns:
        df['Modus_Operandi_Cluster'] = df['CrimeGroup_Name'].astype(str) + "_" + df['District_Name'].astype(str)
    return df
