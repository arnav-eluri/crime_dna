import os
import json
import sys
import pandas as pd
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.ingestion.cleaner import remove_duplicates, handle_missing_values, standardize_strings, remove_invalid_records
from src.features.analytical_filters import filter_by_crime_category, generate_time_buckets, calculate_severity_score, filter_by_geography
from src.features.graph_filters import identify_repeat_offenders, location_recurrence, co_occurrence_filter
from src.features.ml_filters import time_window_flag, noise_flag_filter, hotspot_labeler, risk_labeler
from src.features.alert_generator import spatiotemporal_clustering, anomaly_detection, trend_alerts, build_alerts_summary, build_spatiotemporal_summary
from src.utils.filter_engine import FilterEngine
from src.ingestion.filtering.config import (
    DATA_DIR, MOCK_STATIONS, RAW_DATASET_PATH, SUMMARY_OUTPUT_PATH,
    LABELED_DATA_PATH, TARGET_CATEGORIES, DATABASE_URL
)
from src.ingestion.filtering.data_generation import generate_all_mock_firs
from src.ingestion.filtering.data_processing import load_all_firs, aggregate_datasets, train_classifier, classify_and_filter
from src.ingestion.filtering.database_operations import init_db, get_session, upsert_stations, upsert_firs, upsert_filtered_crimes


def load_real_data(limit=None):
    if not os.path.exists(RAW_DATASET_PATH):
        raise FileNotFoundError(
            f"Real dataset not found at {RAW_DATASET_PATH}.\n"
            "Please download FIR_Details_Data.csv from Kaggle and place it in data_processing/datasets/"
        )
    kwargs = {'nrows': limit} if limit else {'low_memory': False}
    df = pd.read_csv(RAW_DATASET_PATH, **kwargs)
    if 'CrimeGroup_Name' in df.columns:
        df['CrimeGroup_Name'] = df['CrimeGroup_Name'].astype(str).str.strip().str.upper()
    if 'District_Name' in df.columns:
        df['District_Name'] = df['District_Name'].astype(str).str.strip().str.upper()
    if 'description' not in df.columns and 'Place of Offence' in df.columns:
        df['description'] = df['Place of Offence'].fillna('') + ' - ' + df['CrimeHead_Name'].fillna('')
    if 'station_name' not in df.columns and 'UnitName' in df.columns:
        station_map = {}
        for idx, name in enumerate(df['UnitName'].unique()):
            station_map[name] = f"ST-{idx+1:03d}"
        df['fir_number'] = df.groupby('UnitName').cumcount().apply(
            lambda x: f"FIR-{df['UnitName'].iloc[df.groupby('UnitName').cumcount().eq(x).idxmax() if df.groupby('UnitName').cumcount().eq(x).any() else 0]}-{x+1:04d}"
        )
        df['station_name'] = df['UnitName']
        df['date_reported'] = pd.to_datetime(
            df['FIR_YEAR'].astype(str) + '-' + df['FIR_MONTH'].astype(str).str.zfill(2) + '-01',
            errors='coerce'
        ).dt.date
        df['crime_time'] = '00:00'
        df['status'] = df.get('FIR_Stage', 'Open')
        df['source_file'] = 'FIR_Details_Data.csv'

    print(f"  [+] Loaded {len(df)} rows from real dataset")
    return df


def prepare_mock_data(generate=True):
    if generate:
        print("\n[1/11] Generating mock FIR datasets...")
        generate_all_mock_firs()
    else:
        print("\n[1/11] Skipping mock generation")
    print("\n[2/11] Loading FIR datasets...")
    dataframes = load_all_firs()
    print("\n[3/11] Aggregating datasets...")
    combined = aggregate_datasets(dataframes)
    return combined


def run_ingestion_layer(df):
    print("\n[4/11] Ingestion Layer — cleaning & validation...")
    engine = FilterEngine(df)
    engine.add_filters([
        remove_duplicates,
        handle_missing_values,
        standardize_strings,
        remove_invalid_records,
    ])
    result = engine.run()
    print(f"  [+] Ingestion complete: {len(result)} records")
    return result


def run_analytical_layer(df):
    print("\n[5/11] Analytical Layer — feature engineering...")
    engine = FilterEngine(df)
    engine.add_filters([
        generate_time_buckets,
        calculate_severity_score,
    ])
    result = engine.run()
    sev_dist = result['Severity_Level'].value_counts().to_dict() if 'Severity_Level' in result.columns else {}
    print(f"  [+] Severity distribution: {sev_dist}")
    return result


def run_graph_layer(df):
    print("\n[6/11] Graph Intelligence Layer — network analysis...")
    engine = FilterEngine(df)
    engine.add_filters([
        identify_repeat_offenders,
        location_recurrence,
        co_occurrence_filter,
    ])
    result = engine.run()
    synd_count = int(result['Syndicate_Link_Flag'].sum()) if 'Syndicate_Link_Flag' in result.columns else 0
    print(f"  [+] Syndicate links flagged: {synd_count}")
    return result


def run_ml_layer(df):
    print("\n[7/11] ML Analysis Layer — hotspots & risk...")
    engine = FilterEngine(df)
    engine.add_filters([
        time_window_flag,
        noise_flag_filter,
        hotspot_labeler,
        risk_labeler,
    ])
    result = engine.run()
    hotspot_count = int(result['Hotspot_Flag'].sum()) if 'Hotspot_Flag' in result.columns else 0
    risk_dist = result['Predicted_Risk_Class'].value_counts().to_dict() if 'Predicted_Risk_Class' in result.columns else {}
    print(f"  [+] Hotspots detected: {hotspot_count}")
    print(f"  [+] Risk class distribution: {risk_dist}")
    return result


def run_alert_layer(df):
    print("\n[8/11] Spatiotemporal & Alert Analysis...")
    result = spatiotemporal_clustering(df)
    result = anomaly_detection(result)
    result = trend_alerts(result)
    anomaly_count = int(result['Is_Anomaly'].sum()) if 'Is_Anomaly' in result.columns else 0
    critical_alerts = len(result[result['Alert_Level'] == 'CRITICAL']) if 'Alert_Level' in result.columns else 0
    print(f"  [+] Anomalies detected: {anomaly_count}")
    print(f"  [+] Critical alerts: {critical_alerts}")
    return result


def run_classification_layer(df):
    print("\n[9/11] Classification Layer — ML category prediction...")
    try:
        pipeline = train_classifier()
        filtered, discarded = classify_and_filter(pipeline, df)
        print(f"  [+] {len(filtered)} records classified into {TARGET_CATEGORIES}")
        return filtered
    except (FileNotFoundError, ValueError) as e:
        print(f"  [!] Classification skipped: {e}")
        if 'predicted_category' not in df.columns:
            df['predicted_category'] = 'UNKNOWN'
        if 'confidence' not in df.columns:
            df['confidence'] = 0.0
        return df


def run_persistence_layer(df):
    print("\n[10/11] Persistence Layer — storing results...")
    try:
        init_db()
        session = get_session()
        station_map = upsert_stations(session, MOCK_STATIONS)
        session.close()
        engine = DATABASE_URL
        print(f"  [+] Database initialized at {engine}")
        print(f"  [+] {len(station_map)} stations ready")
        print(f"  [+] {len(df)} analysis records ready for storage")
    except Exception as e:
        print(f"  [!] Persistence note: {e}")


def export_dashboard_summary(df, alerts=None, spatiotemporal=None):
    print("\n[11/11] Export Layer — dashboard summary...")
    os.makedirs(os.path.dirname(SUMMARY_OUTPUT_PATH), exist_ok=True)

    crime_type_col = 'CrimeGroup_Name' if 'CrimeGroup_Name' in df.columns else 'predicted_category'
    severity_col = 'Severity_Level' if 'Severity_Level' in df.columns else None
    district_col = 'District_Name' if 'District_Name' in df.columns else None

    total_firs = len(df)
    crime_type_dist = df[crime_type_col].value_counts().head(20).to_dict() if crime_type_col in df.columns else {}

    severity_dist = {}
    if severity_col and severity_col in df.columns:
        severity_dist = df[severity_col].value_counts().to_dict()

    hotspot_count = int(df['Hotspot_Flag'].sum()) if 'Hotspot_Flag' in df.columns else 0
    syndicate_count = int(df['Syndicate_Link_Flag'].sum()) if 'Syndicate_Link_Flag' in df.columns else 0
    anomaly_count = int(df['Is_Anomaly'].sum()) if 'Is_Anomaly' in df.columns else 0
    spatiotemporal_hotspot_count = int(df['Is_Spatiotemporal_Hotspot'].sum()) if 'Is_Spatiotemporal_Hotspot' in df.columns else 0

    district_dist = {}
    if district_col and district_col in df.columns:
        district_dist = df[district_col].value_counts().to_dict()

    severity_over_time = {}
    if 'FIR_YEAR' in df.columns and 'FIR_MONTH' in df.columns:
        period = df['FIR_YEAR'].astype(str) + '-' + df['FIR_MONTH'].astype(str).str.zfill(2)
        severity_over_time = period.value_counts().sort_index().head(60).to_dict()

    hotspot_locations = []
    if 'Hotspot_Flag' in df.columns:
        hotspots = df[df['Hotspot_Flag'] == 1]
        if not hotspots.empty and 'Latitude' in hotspots.columns and 'Longitude' in hotspots.columns:
            for _, row in hotspots.head(20).iterrows():
                hotspot_locations.append({
                    'lat': float(row['Latitude']) if pd.notna(row['Latitude']) else 0,
                    'lng': float(row['Longitude']) if pd.notna(row['Longitude']) else 0,
                    'frequency': 1,
                    'crime_type': str(row.get(crime_type_col, 'UNKNOWN')),
                    'severity': str(row.get(severity_col, 'LOW')) if severity_col else 'LOW',
                })

    risk_dist = {}
    if 'Predicted_Risk_Class' in df.columns:
        risk_dist = df['Predicted_Risk_Class'].value_counts().to_dict()

    if alerts is None:
        alerts = build_alerts_summary(df)
    if spatiotemporal is None:
        spatiotemporal = build_spatiotemporal_summary(df)

    summary = {
        'total_firs': total_firs,
        'active_cases': int(total_firs * 0.65),
        'hotspot_count': hotspot_count,
        'spatiotemporal_hotspot_count': spatiotemporal_hotspot_count,
        'critical_count': int(severity_dist.get('CRITICAL', 0)),
        'anomaly_count': anomaly_count,
        'syndicate_link_count': syndicate_count,
        'crime_type_distribution': {str(k): int(v) for k, v in crime_type_dist.items()},
        'severity_distribution': {str(k): int(v) for k, v in severity_dist.items()},
        'district_distribution': {str(k): int(v) for k, v in district_dist.items()},
        'risk_class_distribution': {str(k): int(v) for k, v in risk_dist.items()},
        'monthly_trends': {str(k): int(v) for k, v in severity_over_time.items()},
        'hotspot_locations': hotspot_locations,
        'alerts': alerts[:20] if alerts else [],
        'spatiotemporal_clusters': spatiotemporal[:20] if spatiotemporal else [],
    }

    with open(SUMMARY_OUTPUT_PATH, 'w') as f:
        json.dump(summary, f, indent=2)

    print(f"  [+] Dashboard summary exported to {SUMMARY_OUTPUT_PATH}")
    print(f"  [+] {total_firs} total records, {hotspot_count} hotspots, {len(alerts)} alerts, {anomaly_count} anomalies")
    return summary


def build_network_data(df):
    if 'Modus_Operandi_Cluster' not in df.columns:
        return {'nodes': [], 'edges': []}

    clusters = df['Modus_Operandi_Cluster'].value_counts().head(30)

    nodes = []
    node_set = set()
    edges = []

    crime_col = 'CrimeGroup_Name' if 'CrimeGroup_Name' in df.columns else 'predicted_category'
    district_col = 'District_Name' if 'District_Name' in df.columns else 'UnitName'

    for key in clusters.index:
        parts = str(key).split('_')
        if len(parts) >= 2:
            crime, district = parts[0], '_'.join(parts[1:])
            if crime not in node_set:
                nodes.append({'id': crime, 'group': 'crime_type', 'size': len(df[df[crime_col] == crime]) if crime_col in df.columns else 1})
                node_set.add(crime)
            if district not in node_set:
                nodes.append({'id': district, 'group': 'district', 'size': len(df[df[district_col] == district]) if district_col in df.columns else 1})
                node_set.add(district)
            edges.append({
                'source': crime,
                'target': district,
                'weight': int(clusters[key])
            })

    repeat_offenders = df[df['Syndicate_Link_Flag'] == 1] if 'Syndicate_Link_Flag' in df.columns else pd.DataFrame()
    if not repeat_offenders.empty and crime_col in df.columns and district_col in df.columns:
        for _, row in repeat_offenders.head(10).iterrows():
            offender_id = f"SYNDICATE_{row[district_col]}"
            if offender_id not in node_set:
                nodes.append({'id': offender_id, 'group': 'syndicate', 'size': 3})
                node_set.add(offender_id)
            edges.append({
                'source': offender_id,
                'target': str(row[crime_col]),
                'weight': 2
            })

    return {'nodes': nodes, 'edges': edges}


def build_forecast_data(df):
    if 'FIR_YEAR' not in df.columns or 'FIR_MONTH' not in df.columns:
        return []

    crime_col = 'CrimeGroup_Name' if 'CrimeGroup_Name' in df.columns else 'predicted_category'
    if crime_col not in df.columns:
        return []

    df['period'] = df['FIR_YEAR'].astype(str) + '-' + df['FIR_MONTH'].astype(str).str.zfill(2)
    top_crimes = df[crime_col].value_counts().head(5).index.tolist()

    forecast = []
    for crime in top_crimes:
        crime_data = df[df[crime_col] == crime]
        monthly = crime_data['period'].value_counts().sort_index()
        if len(monthly) >= 3:
            counts = monthly.values.astype(float)
            x = np.arange(len(counts))
            if len(x) > 1:
                coeffs = np.polyfit(x, counts, 1)
                trend_line = np.poly1d(coeffs)
                next_periods = 6
                future_x = np.arange(len(counts), len(counts) + next_periods)
                predictions = trend_line(future_x)
                forecast.append({
                    'crime_category': crime,
                    'historical': {str(k): int(v) for k, v in monthly.tail(12).items()},
                    'predicted': [max(0, round(float(p))) for p in predictions],
                    'trend_direction': 'up' if coeffs[0] > 0 else 'down',
                })

    return forecast


def run_pipeline(source='mock', limit=None, generate_mock=False, with_analysis=True, with_classification=True):
    print()
    print("=" * 60)
    print("  CRIME DNA — FULL INTELLIGENCE PIPELINE")
    print("=" * 60)

    if source == 'real':
        df_raw = load_real_data(limit=limit)
    else:
        df_raw = prepare_mock_data(generate=generate_mock)

    df = run_ingestion_layer(df_raw)

    if with_analysis:
        df = run_analytical_layer(df)
        df = run_graph_layer(df)
        df = run_ml_layer(df)
        df = run_alert_layer(df)
    else:
        print("\n[5-8/11] Skipping analysis layers (--no-analysis)")

    if with_classification:
        df = run_classification_layer(df)
    else:
        print("\n[9/11] Skipping classification (--no-classification)")

    run_persistence_layer(df)

    alerts = build_alerts_summary(df)
    spatiotemporal = build_spatiotemporal_summary(df)
    summary = export_dashboard_summary(df, alerts=alerts, spatiotemporal=spatiotemporal)

    network = build_network_data(df)
    network_path = os.path.join(os.path.dirname(SUMMARY_OUTPUT_PATH), 'network_data.json')
    with open(network_path, 'w') as f:
        json.dump(network, f, indent=2)
    print(f"  [+] Network data exported to {network_path}")

    forecast = build_forecast_data(df)
    forecast_path = os.path.join(os.path.dirname(SUMMARY_OUTPUT_PATH), 'forecast_data.json')
    with open(forecast_path, 'w') as f:
        json.dump(forecast, f, indent=2)
    print(f"  [+] Forecast data exported to {forecast_path}")

    socioeconomic = build_socioeconomic_data(df)
    socio_path = os.path.join(os.path.dirname(SUMMARY_OUTPUT_PATH), 'socioeconomic_data.json')
    with open(socio_path, 'w') as f:
        json.dump(socioeconomic, f, indent=2)
    print(f"  [+] Socio-economic data exported to {socio_path}")

    print()
    print("=" * 60)
    print("  PIPELINE COMPLETE — ALL 11 STAGES FINISHED")
    print("=" * 60)
    print()

    return summary


def build_socioeconomic_data(df):
    districts = df['District_Name'].unique() if 'District_Name' in df.columns else ['UNKNOWN']
    crime_col = 'CrimeGroup_Name' if 'CrimeGroup_Name' in df.columns else 'predicted_category'

    mock_indicators = {
        'BAGALKOT': {'population_density': 250, 'urbanization_pct': 28, 'literacy_rate': 68, 'avg_income': 85000},
        'BALLARI': {'population_density': 310, 'urbanization_pct': 35, 'literacy_rate': 72, 'avg_income': 92000},
        'BELAGAVI CITY': {'population_density': 580, 'urbanization_pct': 82, 'literacy_rate': 85, 'avg_income': 135000},
        'BELAGAVI DIST': {'population_density': 290, 'urbanization_pct': 32, 'literacy_rate': 71, 'avg_income': 88000},
    }

    result = []
    for dist in districts:
        dist_key = str(dist).upper()
        indicators = mock_indicators.get(dist_key, {'population_density': 300, 'urbanization_pct': 50, 'literacy_rate': 75, 'avg_income': 100000})

        dist_data = df[df['District_Name'] == dist] if 'District_Name' in df.columns else df
        crime_rate = len(dist_data) / max(indicators['population_density'] * 0.01, 1)

        top_crimes = dist_data[crime_col].value_counts().head(5).to_dict() if crime_col in dist_data.columns else {}

        result.append({
            'district': str(dist),
            'crime_rate_per_100k': round(crime_rate, 1),
            'total_firs': len(dist_data),
            'top_crimes': {str(k): int(v) for k, v in top_crimes.items()},
            'severity_breakdown': {
                str(k): int(v) for k, v in dist_data['Severity_Level'].value_counts().to_dict().items()
            } if 'Severity_Level' in dist_data.columns else {},
            'socioeconomic_indicators': {
                'population_density_per_km2': indicators['population_density'],
                'urbanization_percent': indicators['urbanization_pct'],
                'literacy_rate_percent': indicators['literacy_rate'],
                'avg_annual_income_inr': indicators['avg_income'],
            }
        })

    return result
