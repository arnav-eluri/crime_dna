# Data Flow — CrimeDNA

## End-to-End Data Journey

```
[Raw CSV] → [Pipeline] → [JSON artifacts] → [API] → [Frontend]
```

---

## Stage 1 — Source Data Ingestion

### Path A: Real Data
```
datasets/FIR_Details_Data.csv  (Kaggle Karnataka FIR dataset)
  │
  ▼  load_real_data()
  │  pd.read_csv(RAW_DATASET_PATH)
  │  Renames columns:
  │    UnitName       → station_name
  │    FIR_YEAR+MONTH → date_reported (YYYY-MM-01)
  │    Place+CrimeHead → description
  │    FIR_Stage      → status
  ▼
DataFrame (raw, ~50k–100k rows)
```

### Path B: Mock Data
```
data_generation.py → generate_all_mock_firs()
  │  Generates 3 stations × 100 records each = 300 FIRs
  │  Random crime types, districts, lat/lng within Karnataka bbox
  │  Writes to data_processing/data/firs/<station>.csv
  ▼
load_all_firs() → reads all CSVs from data/firs/
aggregate_datasets() → pd.concat(all dataframes)
  ▼
DataFrame (mock, ~300 rows)
```

---

## Stage 2 — 11-Stage Pipeline

### Stage 1–3: Data Preparation
```
[1] generate_all_mock_firs()   → CSV files in data/firs/
[2] load_all_firs()            → List[DataFrame]
[3] aggregate_datasets()       → Single DataFrame
```

### Stage 4: Ingestion Layer — `run_ingestion_layer(df)`
```
FilterEngine([
  remove_duplicates       → drop rows with duplicate fir_number
  handle_missing_values   → fill NaN: CrimeGroup='UNKNOWN', coords=district centroid+noise
  standardize_strings     → .str.strip().str.upper() on name cols
  remove_invalid_records  → drop rows missing fir_number or description
])

Output columns added: none removed; NaN values filled
```

### Stage 5: Analytical Layer — `run_analytical_layer(df)`
```
FilterEngine([
  generate_time_buckets   → adds Time_Bucket (MORNING/AFTERNOON/EVENING/NIGHT)
  calculate_severity_score → adds Severity_Level (LOW/HIGH/CRITICAL)
                             based on crime type keywords + location recurrence
])

New columns: Time_Bucket, Severity_Level, Severity_Score (float)
```

### Stage 6: Graph Layer — `run_graph_layer(df)`
```
FilterEngine([
  identify_repeat_offenders → adds Syndicate_Link_Flag (0/1)
                              crime type appears in ≥ 2 districts
  location_recurrence       → adds Location_Recurrence_Count
                              count of FIRs within same lat/lng bucket
  co_occurrence_filter      → adds Modus_Operandi_Cluster
                              CrimeGroup_Name + '_' + District_Name key
])

New columns: Syndicate_Link_Flag, Location_Recurrence_Count, Modus_Operandi_Cluster
```

### Stage 7: ML Layer — `run_ml_layer(df)`
```
FilterEngine([
  time_window_flag    → adds Is_Historical_Archive (1 if FIR_YEAR < 2016)
  noise_flag_filter   → adds Is_Noisy_Record (1 if CrimeGroup_Name is NaN)
  hotspot_labeler     → adds Hotspot_Flag (1 if DBSCAN cluster, else freq-based)
  risk_labeler        → adds Predicted_Risk_Class (0=Low, 1=High, 2=Critical)
                        mapped from Severity_Level
])

New columns: Is_Historical_Archive, Is_Noisy_Record, Hotspot_Flag, Predicted_Risk_Class
```

### Stage 8: Alert Layer — `run_alert_layer(df)`
```
spatiotemporal_clustering(df)
  → Spatiotemporal_Key = District + Time_Bucket + lat(2dp) + lng(2dp)
  → Cluster_Frequency = count per key
  → Is_Spatiotemporal_Hotspot = 1 if frequency >= 3

anomaly_detection(df)
  → Groups by crime type, counts per group
  → IsolationForest (if ≥ 10 groups) or Z-score (< 10 groups)
  → Anomaly_Score (float), Is_Anomaly (0/1)

trend_alerts(df)
  → Groups by crime type, compares recent 3 months vs historical
  → Alert_Level (NORMAL/ELEVATED/CRITICAL)
  → Percent_Change, Trend_Direction, Historical_Avg

New columns: Spatiotemporal_Key, Cluster_Frequency, Is_Spatiotemporal_Hotspot,
             Anomaly_Score, Is_Anomaly, Alert_Level, Percent_Change,
             Trend_Direction, Historical_Avg
```

### Stage 9: Classification Layer — `run_classification_layer(df)`
```
train_classifier()
  → Loads labeled_crimes.csv (MISSING — returns UNKNOWN for all)
  → TfidfVectorizer + LogisticRegression pipeline
  → Trained on description text → category label

classify_and_filter(pipeline, df)
  → Applies classifier to df['description']
  → predicted_category, confidence columns added

New columns: predicted_category (str), confidence (float 0–1)
```

### Stage 10: Persistence Layer — `run_persistence_layer(df)`
```
init_db()         → CREATE TABLE IF NOT EXISTS (station, fir, filtered_crime)
upsert_stations() → INSERT/UPDATE 3 mock stations only

NOTE: upsert_firs() and upsert_filtered_crimes() are NEVER called.
      The DataFrame is not saved. (see BUG_REPORT.md BE-01)

SQLite DB: data_processing/data/crime_pipeline.db
```

### Stage 11: Export Layer — `export_dashboard_summary(df)`
```
Computes aggregations from the final DataFrame:

  total_firs              = len(df)
  active_cases            = total_firs * 0.65  (hardcoded ratio)
  hotspot_count           = df['Hotspot_Flag'].sum()
  anomaly_count           = df['Is_Anomaly'].sum()
  syndicate_link_count    = df['Syndicate_Link_Flag'].sum()
  crime_type_distribution = CrimeGroup_Name.value_counts().head(20)
  district_distribution   = District_Name.value_counts()
  severity_distribution   = Severity_Level.value_counts()
  risk_class_distribution = Predicted_Risk_Class.value_counts()
  monthly_trends          = (YEAR-MONTH).value_counts().sort_index().head(60)
  hotspot_locations       = top 1000 hotspot rows with lat/lng/crime_type/severity

  alerts                  = build_alerts_summary(df)   → list of Alert dicts
  spatiotemporal_clusters = build_spatiotemporal_summary(df) → list of cluster dicts

Writes: data_processing/data/03_processed/dashboard_summary.json
```

Also exports three sibling JSON files:
```
build_network_data(df)
  → Groups by Modus_Operandi_Cluster → (crime, district) node pairs + edges
  → Writes: network_data.json

build_forecast_data(df)
  → Top 5 crime types: monthly counts + linear regression for 6-month forecast
  → Writes: forecast_data.json

build_socioeconomic_data(df)
  → Per-district: crime rate, top crimes, severity breakdown, socioeconomic indicators
  → Writes: socioeconomic_data.json
```

---

## Stage 3 — API Serving

```
Client Request
  │  GET /api/summary
  ▼
index.js → readJSON('dashboard_summary.json')
           → fs.readFileSync(DATA_DIR/filename, 'utf-8')
           → JSON.parse(...)
           → res.json(data)

All 15 endpoints follow the same pattern.
No DB queries. No async I/O beyond the synchronous file read.
```

**Alert filtering example:**
```
GET /api/alerts?district=BENGALURU&level=CRITICAL

data.alerts                                    (all alerts from JSON)
  .filter(a => a.district === 'BENGALURU')
  .filter(a => a.alert_level === 'CRITICAL')
→ { total_alerts, critical_count, elevated_count, alerts: [...filtered] }
```

**FIR pagination example:**
```
GET /api/firs?page=2&limit=25&crime_type=THEFT

firs = hotspot_locations.map((loc, i) => ({ id, fir_number, crime_type, ... }))
firs = firs.filter(f => f.crime_type.includes('THEFT'))
start = (2 - 1) * 25 = 25
paginated = firs.slice(25, 50)
→ { total, page: 2, limit: 25, total_pages, data: [...25 items] }
```

---

## Stage 4 — Frontend Rendering

### Dashboard data flow
```
Dashboard.tsx mounts
  → useEffect → api.summary() → GET /api/summary
  → setData(CrimeSummary)
  → Renders:
      KpiCard × 8  (total_firs, active_cases, hotspot_count, critical_count,
                    anomaly_count, alerts.length, syndicate_link_count, risk total)
      BarChart     (crime_type_distribution top 10)
      PieChart     (risk_class_distribution)
  → If isMobile: renders MobileDashboard instead (same data, different layout)
```

### CrimeMap data flow
```
CrimeMap.tsx mounts
  → api.hotspots() → { hotspot_count, locations: HotspotLocation[] }
  → Leaflet MapContainer renders over Karnataka centre (15.3173, 75.7139)
  → DynamicCrimeLayer watches zoom + bounds:
      zoom < 11  → HeatmapLayer (leaflet.heat with lat/lng/frequency points)
      zoom >= 11 → NativeMarkersLayer
                     bounds.contains(lat,lng) filter
                     L.circleMarker with severity-coloured fill
                     Popup: crime_type, severity
```

### NetworkGraph data flow
```
NetworkGraph.tsx mounts
  → api.network() → { nodes: NetworkNode[], edges: NetworkEdge[] }
  → Builds nodeMap (Map<id, SimNode>) and edgeList
  → requestAnimationFrame loop:
      apply physics (gravity + repulsion + spring + damping)
      ctx.clearRect → draw edges (strokeOpacity ∝ weight) → draw nodes (colour ∝ group)
  → mousedown/mousemove → draggedNode.fx/fy = mouse position
  → mouseup → clears fx/fy (node released to simulation)
```

### FIRList data flow
```
FIRList.tsx mounts
  → api.firs({ page: 1, limit: 25 })
  → setFirs(res.data), setTotal(res.total)
  → Table renders 25 rows
  → User changes filterType → (BUG: page not reset) → api.firs({ crime_type, page })
  → Pagination: prev/next buttons → setPage(page ± 1)
```

---

## Column Lineage

The DataFrame accumulates columns as it flows through each stage:

| Column | Added by | Type | Notes |
|--------|----------|------|-------|
| `fir_number` | ingestion/mock | str | FIR-STATION-NNNN |
| `description` | load_real_data | str | Place + CrimeHead concatenation |
| `District_Name` | source CSV | str | Uppercased |
| `CrimeGroup_Name` | source CSV | str | Uppercased |
| `Latitude`, `Longitude` | source CSV / imputed | float | 0.0 if unknown |
| `FIR_YEAR`, `FIR_MONTH` | source CSV | int | Used for time windowing |
| `Time_Bucket` | analytical_filters | str | MORNING/AFTERNOON/EVENING/NIGHT |
| `Severity_Level` | analytical_filters | str | LOW/HIGH/CRITICAL |
| `Severity_Score` | analytical_filters | float | 0.0–1.0 |
| `Location_Recurrence_Count` | graph_filters | int | FIRs in same location bucket |
| `Syndicate_Link_Flag` | graph_filters | int | 0 or 1 |
| `Modus_Operandi_Cluster` | graph_filters | str | CrimeGroup_District key |
| `Is_Historical_Archive` | ml_filters | int | 0 or 1 (> 10 years old) |
| `Is_Noisy_Record` | ml_filters | int | 0 or 1 |
| `Hotspot_Flag` | ml_filters | int | 0 or 1 |
| `Predicted_Risk_Class` | ml_filters | int | 0=Low, 1=High, 2=Critical |
| `Spatiotemporal_Key` | alert_generator | str | District_TimeBucket_Lat_Lng |
| `Cluster_Frequency` | alert_generator | int | Count per spatiotemporal key |
| `Is_Spatiotemporal_Hotspot` | alert_generator | int | 0 or 1 (freq ≥ 3) |
| `Anomaly_Score` | alert_generator | float | IsolationForest score |
| `Is_Anomaly` | alert_generator | int | 0 or 1 |
| `Alert_Level` | alert_generator | str | NORMAL/ELEVATED/CRITICAL |
| `Percent_Change` | alert_generator | float | % vs historical avg |
| `Trend_Direction` | alert_generator | str | up/down/stable |
| `Historical_Avg` | alert_generator | float | ≈ 1.0 due to bug |
| `predicted_category` | data_processing | str | ML label or UNKNOWN |
| `confidence` | data_processing | float | Model confidence 0–1 |
