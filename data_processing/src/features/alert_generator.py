import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest


def spatiotemporal_clustering(df: pd.DataFrame) -> pd.DataFrame:
    if 'Latitude' not in df.columns or 'Longitude' not in df.columns:
        return df

    lat_mask = (df['Latitude'] != 0.0) & (df['Longitude'] != 0.0)
    valid = df[lat_mask].copy()

    if 'FIR_HOUR' not in valid.columns and 'crime_time' in valid.columns:
        try:
            valid['FIR_HOUR'] = pd.to_numeric(
                valid['crime_time'].str.split(':').str[0], errors='coerce'
            ).fillna(-1).astype(int)
        except (AttributeError, KeyError):
            valid['FIR_HOUR'] = -1

    if 'FIR_HOUR' not in valid.columns:
        valid['FIR_HOUR'] = -1

    def hour_bucket(h):
        if h < 0:
            return 'UNKNOWN'
        if 6 <= h < 12:
            return 'MORNING'
        if 12 <= h < 18:
            return 'AFTERNOON'
        if 18 <= h < 24:
            return 'EVENING'
        return 'NIGHT'

    valid['Time_Bucket'] = valid['FIR_HOUR'].apply(hour_bucket)

    if 'District_Name' in valid.columns:
        valid['Spatiotemporal_Key'] = (
            valid['District_Name'].astype(str) + '_'
            + valid['Time_Bucket'].astype(str) + '_'
            + valid['Latitude'].round(2).astype(str) + '_'
            + valid['Longitude'].round(2).astype(str)
        )
    else:
        valid['Spatiotemporal_Key'] = (
            valid['Time_Bucket'].astype(str) + '_'
            + valid['Latitude'].round(2).astype(str) + '_'
            + valid['Longitude'].round(2).astype(str)
        )

    cluster_counts = valid['Spatiotemporal_Key'].value_counts()
    valid['Cluster_Frequency'] = valid['Spatiotemporal_Key'].map(cluster_counts)
    valid['Is_Spatiotemporal_Hotspot'] = (valid['Cluster_Frequency'] >= 3).astype(int)

    result = df.copy()
    result.loc[lat_mask, 'Time_Bucket'] = valid['Time_Bucket']
    result.loc[lat_mask, 'Spatiotemporal_Key'] = valid['Spatiotemporal_Key']
    result.loc[lat_mask, 'Cluster_Frequency'] = valid['Cluster_Frequency']
    result.loc[lat_mask, 'Is_Spatiotemporal_Hotspot'] = valid['Is_Spatiotemporal_Hotspot']

    for col in ['Time_Bucket', 'Spatiotemporal_Key', 'Cluster_Frequency', 'Is_Spatiotemporal_Hotspot']:
        if col not in result.columns:
            result[col] = 0 if col in ('Cluster_Frequency', 'Is_Spatiotemporal_Hotspot') else 'UNKNOWN'

    return result


def anomaly_detection(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['Anomaly_Score'] = 0.0
    df['Is_Anomaly'] = 0

    crime_group_col = 'CrimeGroup_Name' if 'CrimeGroup_Name' in df.columns else 'predicted_category'

    if crime_group_col not in df.columns:
        return df

    pivot = df.groupby([crime_group_col]).size().reset_index(name='crime_count')
    if len(pivot) < 3:
        return df

    features = pivot[['crime_count']].copy()
    features['count_rank'] = features['crime_count'].rank(pct=True)

    if len(pivot) >= 10:
        iso = IsolationForest(contamination=0.1, random_state=42, n_estimators=50)
        pivot['anomaly_label'] = iso.fit_predict(features)
        pivot['anomaly_score_raw'] = iso.score_samples(features)
    else:
        mean_c = features['crime_count'].mean()
        std_c = features['crime_count'].std()
        if std_c > 0:
            pivot['z_score'] = (features['crime_count'] - mean_c) / std_c
            pivot['anomaly_label'] = (pivot['z_score'].abs() > 2).astype(int) * -1
            pivot['anomaly_label'] = pivot['anomaly_label'].replace(0, 1)
            pivot['anomaly_score_raw'] = -pivot['z_score'].abs()
        else:
            pivot['anomaly_label'] = 1
            pivot['anomaly_score_raw'] = 0.0

    anomaly_map = dict(zip(pivot[crime_group_col], pivot['anomaly_score_raw']))
    anomaly_flag_map = dict(zip(pivot[crime_group_col], (pivot['anomaly_label'] == -1).astype(int)))

    df['Anomaly_Score'] = df[crime_group_col].map(anomaly_map).fillna(0.0)
    df['Is_Anomaly'] = df[crime_group_col].map(anomaly_flag_map).fillna(0).astype(int)

    return df


def trend_alerts(df: pd.DataFrame, window_months: int = 3) -> pd.DataFrame:
    df = df.copy()
    df['Alert_Level'] = 'NORMAL'
    df['Percent_Change'] = 0.0
    df['Trend_Direction'] = 'stable'
    df['Historical_Avg'] = 0.0

    crime_col = 'CrimeGroup_Name' if 'CrimeGroup_Name' in df.columns else 'predicted_category'
    has_year = 'FIR_YEAR' in df.columns
    has_month = 'FIR_MONTH' in df.columns

    if not has_year or not has_month or crime_col not in df.columns:
        return df

    df['period'] = df['FIR_YEAR'].astype(str) + '-' + df['FIR_MONTH'].astype(str).str.zfill(2)

    all_periods = sorted(df['period'].unique())
    if len(all_periods) < window_months + 1:
        return df

    recent_cutoff = all_periods[-window_months]

    for crime in df[crime_col].unique():
        crime_mask = df[crime_col] == crime
        recent = df[crime_mask & (df['period'] >= recent_cutoff)]
        historical = df[crime_mask & (df['period'] < recent_cutoff)]

        if len(historical) == 0:
            continue

        recent_count = len(recent)
        hist_months = max(len(historical), 1)
        historical_avg = len(historical) / hist_months

        df.loc[crime_mask, 'Historical_Avg'] = round(historical_avg, 2)

        if historical_avg > 0:
            pct_change = ((recent_count - historical_avg) / historical_avg) * 100
            df.loc[crime_mask, 'Percent_Change'] = round(pct_change, 1)

            if pct_change > 50:
                df.loc[crime_mask, 'Alert_Level'] = 'CRITICAL'
                df.loc[crime_mask, 'Trend_Direction'] = 'up'
            elif pct_change > 20:
                df.loc[crime_mask, 'Alert_Level'] = 'ELEVATED'
                df.loc[crime_mask, 'Trend_Direction'] = 'up'
            elif pct_change < -20:
                df.loc[crime_mask, 'Alert_Level'] = 'ELEVATED'
                df.loc[crime_mask, 'Trend_Direction'] = 'down'
            else:
                df.loc[crime_mask, 'Alert_Level'] = 'NORMAL'
                df.loc[crime_mask, 'Trend_Direction'] = 'stable'

    return df


def build_alerts_summary(df: pd.DataFrame) -> list:
    alerts = []
    required = {'Alert_Level', 'Percent_Change', 'CrimeGroup_Name', 'District_Name', 'Trend_Direction', 'Historical_Avg'}
    if not required.intersection(df.columns):
        return alerts

    grouped = df.groupby(['District_Name', 'CrimeGroup_Name', 'Alert_Level']).agg(
        current_count=('CrimeGroup_Name', 'count'),
        pct_change=('Percent_Change', 'first'),
        hist_avg=('Historical_Avg', 'first'),
        direction=('Trend_Direction', 'first')
    ).reset_index()

    for _, row in grouped.iterrows():
        if row['Alert_Level'] in ('CRITICAL', 'ELEVATED'):
            alerts.append({
                'district': str(row['District_Name']),
                'crime_category': str(row['CrimeGroup_Name']),
                'alert_level': str(row['Alert_Level']),
                'current_count': int(row['current_count']),
                'historical_avg': round(float(row['hist_avg']), 2) if pd.notna(row['hist_avg']) else 0,
                'percent_change': float(row['pct_change']) if pd.notna(row['pct_change']) else 0,
                'trend_direction': str(row['direction'])
            })

    return sorted(alerts, key=lambda x: x['percent_change'], reverse=True)


def build_spatiotemporal_summary(df: pd.DataFrame) -> list:
    if 'Spatiotemporal_Key' not in df.columns or 'Time_Bucket' not in df.columns:
        return []

    required_geo = {'Latitude', 'Longitude'}
    if not required_geo.intersection(df.columns):
        return []

    clusters = df[df['Is_Spatiotemporal_Hotspot'] == 1].copy() if 'Is_Spatiotemporal_Hotspot' in df.columns else df.copy()

    if clusters.empty:
        return []

    summary = []
    grouped = clusters.groupby('Spatiotemporal_Key')
    for key, group in grouped:
        parts = str(key).split('_')
        if len(parts) >= 4:
            time_bucket = parts[1]
            lat = float(group['Latitude'].iloc[0])
            lng = float(group['Longitude'].iloc[0])
            summary.append({
                'lat': lat,
                'lng': lng,
                'time_bucket': time_bucket,
                'frequency': len(group),
                'crime_categories': group['CrimeGroup_Name'].value_counts().head(3).to_dict() if 'CrimeGroup_Name' in group.columns else {},
                'severity_level': group['Severity_Level'].mode().iloc[0] if 'Severity_Level' in group.columns and not group['Severity_Level'].mode().empty else 'LOW'
            })

    return sorted(summary, key=lambda x: x['frequency'], reverse=True)[:50]
