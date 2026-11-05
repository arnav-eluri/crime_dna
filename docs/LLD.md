# Low-Level Design (LLD) — CrimeDNA

## 1. Python Pipeline — Module Design

### 1.1 Module Map

```
data_processing/
├── orchestration/
│   └── pipeline_orchestrator.py      # Entry point; composes all 11 stages
├── src/
│   ├── ingestion/
│   │   ├── cleaner.py                # Stage 4: dedup, missing values, standardise
│   │   ├── validator.py              # (planned) schema validation
│   │   ├── deduplicator.py           # (planned) advanced dedup
│   │   └── filtering/
│   │       ├── config.py             # Paths, constants, mock station list
│   │       ├── data_generation.py    # Stages 1–3: generate & load mock FIRs
│   │       ├── data_processing.py    # Stage 9: TF-IDF + LogReg classifier
│   │       └── database_operations.py # Stage 10: SQLAlchemy models + upsert
│   ├── features/
│   │   ├── analytical_filters.py     # Stage 5: time buckets, severity scoring
│   │   ├── graph_filters.py          # Stage 6: repeat offenders, co-occurrence
│   │   ├── ml_filters.py             # Stage 7: DBSCAN hotspots, risk labels
│   │   ├── alert_generator.py        # Stage 8: spatiotemporal, anomaly, trend alerts
│   │   ├── crime_dna_gen.py          # Modus operandi cluster key generator
│   │   └── graph_builder.py          # (empty placeholder)
│   ├── loaders/
│   │   ├── sqlite_loader.py          # (empty placeholder)
│   │   └── neo4j_loader.py           # (empty placeholder)
│   └── utils/
│       ├── filter_engine.py          # FilterEngine: composes pure df→df functions
│       └── dashboard_filters.py      # (utility filters for dashboard output)
└── datasets/
    └── FIR_Details_Data.csv          # (not committed — download from Kaggle)
```

---

### 1.2 FilterEngine

**File:** `src/utils/filter_engine.py`

The core composability primitive. Every pipeline stage is a pure function `(df: DataFrame) → DataFrame`. `FilterEngine` runs them in sequence:

```python
class FilterEngine:
    def __init__(self, df):
        self.df = df
        self.filters = []

    def add_filters(self, fns):
        self.filters.extend(fns)

    def run(self):
        for fn in self.filters:
            self.df = fn(self.df)
        return self.df
```

Usage pattern across all stages:
```python
engine = FilterEngine(df)
engine.add_filters([fn1, fn2, fn3])
result = engine.run()
```

---

### 1.3 Database Schema (SQLAlchemy ORM)

**File:** `src/ingestion/filtering/database_operations.py`

```
Station
  id          INTEGER PK autoincrement
  name        VARCHAR(200) NOT NULL
  jurisdiction VARCHAR(200)
  city        VARCHAR(100)
  └─► firs    [one-to-many]

Fir
  id          INTEGER PK autoincrement
  station_id  INTEGER FK → station.id NOT NULL
  fir_number  VARCHAR(50) NOT NULL
  date_reported DATE NOT NULL
  crime_time  VARCHAR(50)
  description TEXT NOT NULL
  status      VARCHAR(50) DEFAULT 'Open'
  source_file VARCHAR(200)
  └─► filtered [one-to-one]

FilteredCrime
  id          INTEGER PK autoincrement
  fir_id      INTEGER FK → fir.id NOT NULL UNIQUE
  category    VARCHAR(100) NOT NULL
  confidence  FLOAT
  filter_date DATETIME DEFAULT now()
```

**DB:** SQLite at `data_processing/data/crime_pipeline.db`

---

### 1.4 ML Classifier (Stage 9)

**File:** `src/ingestion/filtering/data_processing.py`

```
Input:  FIR description text (free-form string)
Model:  sklearn Pipeline
        └── TfidfVectorizer(max_features=5000, ngram_range=(1,2))
        └── LogisticRegression(C=1.0, max_iter=1000)
Labels: ['Violent', 'Financial', 'Cyber', 'Property', 'Drug-related']
Train:  labeled_crimes.csv (MISSING — see BUG_REPORT.md PY-01)
Output: predicted_category, confidence (float 0–1)
```

---

### 1.5 Hotspot Labeller (Stage 7)

**File:** `src/features/ml_filters.py` → `hotspot_labeler()`

```
Priority 1: DBSCAN spatial clustering
  Input:  valid (lat, lng) pairs where lat != 0 and lng != 0
  Params: eps=0.01 (≈ 1 km), min_samples=10
  Output: Hotspot_Flag=1 if cluster label != -1 (noise)
  Trigger: at least 100 valid coordinate rows

Priority 2: Statistical frequency fallback
  Input:  Location_Recurrence_Count column
  Threshold: max(95th percentile, 3)
  Output: Hotspot_Flag=1 if count >= threshold
```

---

### 1.6 Anomaly Detection (Stage 8)

**File:** `src/features/alert_generator.py` → `anomaly_detection()`

```
Group by crime type → count per group → feature matrix [count, count_rank]

If groups >= 10:
  IsolationForest(contamination=0.1, n_estimators=50, random_state=42)
  Is_Anomaly = 1 when label == -1

Else (< 10 groups):
  Z-score: anomaly if |z| > 2

Output columns: Anomaly_Score (float), Is_Anomaly (0/1)
```

---

### 1.7 Trend Alert Logic (Stage 8)

**File:** `src/features/alert_generator.py` → `trend_alerts()`

```
For each crime type:
  recent   = records in last window_months (default 3) periods
  historical = records before that window

  historical_avg = len(historical) / len(historical)  ← BUG: always ≈ 1.0
  pct_change = (recent_count - historical_avg) / historical_avg * 100

  pct_change > 50%  → CRITICAL  ↑
  pct_change > 20%  → ELEVATED  ↑
  pct_change < -20% → ELEVATED  ↓
  else              → NORMAL

Output columns: Alert_Level, Percent_Change, Trend_Direction, Historical_Avg
```

---

### 1.8 Spatiotemporal Clustering (Stage 8)

**File:** `src/features/alert_generator.py` → `spatiotemporal_clustering()`

```
Key: District_Name + '_' + Time_Bucket + '_' + lat(2dp) + '_' + lng(2dp)

Time buckets:
  06:00–12:00 → MORNING
  12:00–18:00 → AFTERNOON
  18:00–24:00 → EVENING
  00:00–06:00 → NIGHT
  unknown      → UNKNOWN

Is_Spatiotemporal_Hotspot = 1 if Cluster_Frequency >= 3
```

---

## 2. Backend API — Route Design

**File:** `functions/crime_dna/index.js`

### 2.1 Middleware Stack

```
Request → CORS headers (Access-Control-Allow-Origin: *) 
        → Catalyst SDK init (optional, no-op on failure)
        → Route handler
        → readJSON(filename) → JSON.parse(fs.readFileSync(...))
        → Response
```

### 2.2 Route Table

| Method | Path | JSON file | Query params |
|--------|------|-----------|--------------|
| GET | `/api/health` | `dashboard_summary.json` | — |
| GET | `/api/summary` | `dashboard_summary.json` | — |
| GET | `/api/trends` | `dashboard_summary.json` | — |
| GET | `/api/hotspots` | `dashboard_summary.json` | — |
| GET | `/api/severity` | `dashboard_summary.json` | — |
| GET | `/api/offenders` | `dashboard_summary.json` | — |
| GET | `/api/alerts` | `dashboard_summary.json` | `district`, `level` |
| GET | `/api/anomalies` | `dashboard_summary.json` | — |
| GET | `/api/spatiotemporal` | `dashboard_summary.json` | — |
| GET | `/api/network` | `network_data.json` | — |
| GET | `/api/forecast` | `forecast_data.json` | — |
| GET | `/api/associations` | both | — |
| GET | `/api/socioeconomic` | `socioeconomic_data.json` | — |
| GET | `/api/firs` | `dashboard_summary.json` | `district`, `crime_type`, `severity`, `page`, `limit` |
| GET | `/api/firs/:id` | `dashboard_summary.json` | — |

### 2.3 Pagination (GET /api/firs)

```
page  : integer, default 1
limit : integer, default 50

start = (page - 1) * limit
result = firs.slice(start, start + limit)

Response: { total, page, limit, total_pages, data: FIRRecord[] }
```

### 2.4 Data Files Location

```
functions/crime_dna/data/
  ├── dashboard_summary.json    # KPIs, hotspots, alerts, clusters, distributions
  ├── network_data.json         # { nodes: NetworkNode[], edges: NetworkEdge[] }
  ├── forecast_data.json        # Forecast[] with historical + predicted per crime
  └── socioeconomic_data.json   # SocioEconomic[] per district
```

---

## 3. Frontend — Component Design

### 3.1 Route Map

**File:** `client/src/App.tsx`

```
HashRouter
  └── /app-layout
        ├── <Navbar />           sidebar (desktop) + bottom nav (mobile)
        └── <main>
              └── <Preloader>    2-second animated transition overlay
                    ├── /              → Dashboard.tsx
                    ├── /map           → CrimeMap.tsx
                    ├── /trends        → Trends.tsx
                    ├── /alerts        → Alerts.tsx
                    ├── /severity      → Severity.tsx
                    ├── /network       → NetworkGraph.tsx
                    └── /firs          → FIRList.tsx
```

### 3.2 Data Fetching Pattern

**File:** `client/src/api.ts`

All pages use the same fetch wrapper:
```ts
async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

`API_BASE`:
- Dev: `http://localhost:9000` (or `VITE_API_URL` env var)
- Prod: `/server/crime_dna`

### 3.3 Page → API Mapping

| Page | API call(s) | Key data displayed |
|------|------------|-------------------|
| `Dashboard` | `api.summary()` | 8 KPI cards, top crimes bar chart, risk pie |
| `CrimeMap` | `api.hotspots()` | Leaflet heatmap + marker pins |
| `Trends` | `api.trends()`, `api.forecast()` | Monthly line chart, crime bar chart |
| `Alerts` | `api.alerts()` | Alert cards filtered by level |
| `Severity` | `api.severity()`, `api.socioeconomic()` | Severity donut, risk bar, socioeconomic table |
| `NetworkGraph` | `api.network()` | Custom physics SVG force-directed graph |
| `FIRList` | `api.firs()` | Paginated table with search + filter |

### 3.4 TypeScript Type Hierarchy

**File:** `client/src/types.ts`

```
CrimeSummary
  ├── total_firs, active_cases, hotspot_count, ...  (number scalars)
  ├── crime_type_distribution                        (Record<string, number>)
  ├── severity_distribution                          (Record<string, number>)
  ├── district_distribution                          (Record<string, number>)
  ├── risk_class_distribution                        (Record<string, number>)
  ├── monthly_trends                                 (Record<string, number>)
  ├── hotspot_locations: HotspotLocation[]
  ├── alerts: Alert[]
  └── spatiotemporal_clusters: SpatiotemporalCluster[]

Alert
  ├── district, crime_category                       (string)
  ├── alert_level: 'NORMAL' | 'ELEVATED' | 'CRITICAL'
  ├── current_count, historical_avg, percent_change  (number)
  └── trend_direction: 'up' | 'down' | 'stable'

NetworkData
  ├── nodes: NetworkNode[]  { id, group, size }
  └── edges: NetworkEdge[]  { source, target, weight }

Forecast
  ├── crime_category                 (string)
  ├── historical: Record<string, number>
  ├── predicted: number[]
  └── trend_direction: 'up' | 'down'

SocioEconomic
  ├── district, crime_rate_per_100k, total_firs
  ├── top_crimes: Record<string, number>
  ├── severity_breakdown: Record<string, number>
  └── socioeconomic_indicators { population_density, urbanization, literacy, avg_income }
```

### 3.5 NetworkGraph — Physics Simulation

**File:** `client/src/pages/NetworkGraph.tsx`

Custom force-directed graph (no D3). Runs in a `requestAnimationFrame` loop:

```
nodeMap: Map<id, { x, y, vx, vy, fx, fy, group, size }>
edgeList: { source, target, weight }[]

Each tick:
  1. Apply gravity  → pull towards canvas centre (force ∝ distance)
  2. Apply repulsion → push nodes apart (force ∝ 1/distance²)
  3. Apply spring   → pull connected nodes together (Hooke's law)
  4. Apply damping  → multiply velocity by 0.85 each frame
  5. Clamp position → keep nodes within canvas bounds
  6. Render         → clear canvas, draw edges (opacity ∝ weight), draw nodes

Drag: mousedown sets draggedNode; mousemove updates fx/fy; mouseup clears fx/fy
```

### 3.6 CrimeMap — Heatmap / Marker Toggle

**File:** `client/src/pages/CrimeMap.tsx`

```
zoom < 11  → leaflet.heat heatmap layer
zoom >= 11 → NativeMarkersLayer
              Creates L.featureGroup with L.circleMarker per hotspot
              Color: severity-based (red=CRITICAL, orange=HIGH, green=LOW)
              Popup: crime_type, severity, lat/lng

Data filtered to map bounds on each zoom/pan:
  const visibleData = data.filter(c => bounds.contains([c.lat, c.lng]))
```

---

## 4. Configuration

### 4.1 Key Config Values

| Constant | Value | File |
|----------|-------|------|
| `DATABASE_URL` | `sqlite:///data_processing/data/crime_pipeline.db` | `config.py` |
| `DATA_DIR` | `data_processing/data/firs/` | `config.py` |
| `SUMMARY_OUTPUT_PATH` | `data_processing/data/03_processed/dashboard_summary.json` | `config.py` |
| `RAW_DATASET_PATH` | `data_processing/datasets/FIR_Details_Data.csv` | `config.py` |
| `TARGET_CATEGORIES` | `['Violent', 'Financial', 'Cyber', 'Property', 'Drug-related']` | `config.py` |
| `MOCK_RECORDS_PER_STATION` | `100` | `config.py` |
| Backend port | `9000` | `index.js:229` |
| API base (dev) | `http://localhost:9000` | `api.ts:1` |
| API base (prod) | `/server/crime_dna` | `api.ts:1` |

### 4.2 Environment Variables

| Variable | Used in | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `client/src/api.ts` | Override API base URL |
| `PORT` | `functions/crime_dna/index.js` | Backend listen port (default 9000) |
