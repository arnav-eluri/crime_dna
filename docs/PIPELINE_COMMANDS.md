# Pipeline & Dev Commands — CrimeDNA

## Setup

### Python Pipeline

```bash
cd data_processing
pip install -r requirements.txt
```

**requirements.txt dependencies:**
- `pandas` — data loading and manipulation
- `numpy` — numerical ops, polyfit for forecasting
- `scikit-learn` — IsolationForest, DBSCAN, TF-IDF, LogisticRegression
- `sqlalchemy` — ORM for SQLite persistence
- `scipy` — listed but not directly imported

---

### Frontend

```bash
cd client
npm install
```

**Key dependencies:**
- `react@^19.2.7` — UI library
- `react-router-dom@^7.18.1` — HashRouter + nested routes
- `recharts@^2.15.3` — BarChart, PieChart, LineChart
- `react-leaflet` + `leaflet` — interactive map
- `leaflet.heat` — heatmap overlay
- `typescript@^5.8.3`
- `vite@^6.3.5`

---

### Backend

```bash
cd functions/crime_dna
npm install
```

**Key dependencies:**
- `express@^5.2.1`
- `zcatalyst-sdk-node: "latest"` — Zoho Catalyst SDK

---

## Running Locally

### Start everything (frontend + backend together)

```bash
cd client
npm run dev
```

This runs `npx concurrently "vite" "node ../functions/crime_dna/index.js"`.

> Note: `concurrently` is not in `devDependencies`, so `npx` auto-downloads it. Install manually to avoid delays: `npm install -D concurrently`.

### Start backend only

```bash
node functions/crime_dna/index.js
# Listens on PORT env var or 9000
```

### Start frontend only

```bash
cd client
npx vite
# Dev server on http://localhost:5173
```

---

## Pipeline Commands

Run from `data_processing/` directory.

### Generate mock data + run full pipeline

```bash
python -m orchestration.pipeline_orchestrator --all
```

This runs all 11 stages:
1. Generate mock FIRs (3 stations × 100 records)
2. Load from `data/firs/`
3. Aggregate datasets
4. Ingestion: clean + deduplicate
5. Analytical: severity + time buckets
6. Graph: repeat offenders + co-occurrence
7. ML: hotspots (DBSCAN) + risk labels
8. Alert: spatiotemporal clustering + anomaly detection + trend alerts
9. Classification: TF-IDF + LogReg (skipped if `labeled_crimes.csv` missing)
10. Persistence: write stations to SQLite (FIR data not persisted — see bug report)
11. Export: write 4 JSON artifacts

### Run with mock data (skip generation)

```bash
python -m orchestration.pipeline_orchestrator --run --source mock
```

### Run with real data (Kaggle CSV)

Place `FIR_Details_Data.csv` in `data_processing/datasets/`, then:

```bash
python -m orchestration.pipeline_orchestrator --run --source real
```

### Run with row limit (for fast testing)

```bash
python -m orchestration.pipeline_orchestrator --run --source real --limit 1000
```

### Generate mock data only (no pipeline run)

```bash
python -m orchestration.pipeline_orchestrator --generate-mock
```

### Skip analysis layers (ingestion + export only)

```bash
python -m orchestration.pipeline_orchestrator --run --no-analysis
```

### Skip ML classification

```bash
python -m orchestration.pipeline_orchestrator --run --no-classification
```

---

## Pipeline Output Files

After a successful run, four JSON files are written to `data_processing/data/03_processed/`:

| File | Size (approx) | Contents |
|------|---------------|----------|
| `dashboard_summary.json` | 500KB–5MB | KPIs, distributions, hotspot locations, alerts, spatiotemporal clusters |
| `network_data.json` | 50–500KB | Nodes and edges for force-directed graph |
| `forecast_data.json` | 10–100KB | 6-month linear regression forecast per top-5 crime |
| `socioeconomic_data.json` | 20–200KB | Per-district indicators |

These files must be **copied to `functions/crime_dna/data/`** before deploying (or for local API testing):

```bash
cp data_processing/data/03_processed/*.json functions/crime_dna/data/
```

---

## Build & Deploy

### Build frontend

```bash
cd client
npm run build
# Output: client/build/
```

The build script also copies `client-package.json` → `client/build/client-package.json` for Catalyst.

### Deploy to Catalyst

```bash
# From project root (requires Catalyst CLI installed + logged in)
catalyst deploy
```

This deploys:
- `functions/crime_dna/` as a Catalyst Function (Node.js)
- `client/build/` as a Catalyst Static Site

The function is accessible at `/server/crime_dna` relative to the app domain.

---

## Database Commands

The SQLite DB is at `data_processing/data/crime_pipeline.db`.

```bash
# Open with sqlite3 CLI
sqlite3 data_processing/data/crime_pipeline.db

# Check tables
.tables

# Count rows
SELECT count(*) FROM station;
SELECT count(*) FROM fir;
SELECT count(*) FROM filtered_crime;

# View stations
SELECT * FROM station;
```

> Note: Only `station` table will have data after pipeline run. `fir` and `filtered_crime` tables will be empty due to BE-01 (upsert functions never called).

---

## Useful Development Checks

### Verify JSON output is valid

```bash
python -c "import json; json.load(open('data_processing/data/03_processed/dashboard_summary.json'))"
python -c "import json; json.load(open('functions/crime_dna/data/dashboard_summary.json'))"
```

### Check API health

```bash
curl http://localhost:9000/api/health
```

### Check summary totals

```bash
curl http://localhost:9000/api/summary | python -m json.tool | grep total_firs
```

### Test FIR pagination

```bash
curl "http://localhost:9000/api/firs?page=1&limit=5"
curl "http://localhost:9000/api/firs?crime_type=THEFT&page=1&limit=10"
```

### Test alert filter

```bash
curl "http://localhost:9000/api/alerts?level=CRITICAL"
curl "http://localhost:9000/api/alerts?district=BENGALURU%20DIST&level=ELEVATED"
```

---

## Environment Variables

| Variable | Where | Default | Purpose |
|----------|-------|---------|---------|
| `VITE_API_URL` | `client/.env` | `http://localhost:9000` | Override API base for frontend |
| `PORT` | shell | `9000` | Backend listen port |

Create `client/.env.local` for local overrides:
```
VITE_API_URL=http://localhost:9000
```

---

## TypeScript Type Check

```bash
cd client
npx tsc --noEmit
```

---

## Lint

```bash
cd client
npx eslint src/
```
