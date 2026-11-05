# Schema Reference — CrimeDNA

## 1. SQLite Database Schema

**Location:** `data_processing/data/crime_pipeline.db`

### Table: `station`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, autoincrement | Internal station ID |
| `name` | VARCHAR(200) | NOT NULL | Station name (e.g. "Central Police Station") |
| `jurisdiction` | VARCHAR(200) | nullable | Area of jurisdiction |
| `city` | VARCHAR(100) | nullable | City |

### Table: `fir`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, autoincrement | Internal FIR ID |
| `station_id` | INTEGER | FK → station.id NOT NULL | Owning station |
| `fir_number` | VARCHAR(50) | NOT NULL | e.g. "FIR-Central Police Station-0001" |
| `date_reported` | DATE | NOT NULL | Date FIR was filed |
| `crime_time` | VARCHAR(50) | nullable | Time string "HH:MM" |
| `description` | TEXT | NOT NULL | Free-form incident description |
| `status` | VARCHAR(50) | DEFAULT 'Open' | FIR stage / status |
| `source_file` | VARCHAR(200) | nullable | Source CSV filename |

### Table: `filtered_crime`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PK, autoincrement | Internal ID |
| `fir_id` | INTEGER | FK → fir.id NOT NULL UNIQUE | One-to-one with FIR |
| `category` | VARCHAR(100) | NOT NULL | ML predicted category |
| `confidence` | FLOAT | nullable | Classifier confidence 0–1 |
| `filter_date` | DATETIME | DEFAULT now() | When record was classified |

### Relationships

```
station (1) ──────────── (*) fir (1) ─────────────── (0..1) filtered_crime
         cascade delete              cascade delete
```

---

## 2. JSON Artifact Schemas

### 2.1 dashboard_summary.json

Root object with all KPI data.

```ts
{
  total_firs: number,
  active_cases: number,              // total_firs * 0.65 (hardcoded ratio)
  hotspot_count: number,
  spatiotemporal_hotspot_count: number,
  critical_count: number,
  anomaly_count: number,
  syndicate_link_count: number,

  // Distributions (key: label, value: count)
  crime_type_distribution: Record<string, number>,   // top 20
  severity_distribution: Record<string, number>,     // LOW/HIGH/CRITICAL
  district_distribution: Record<string, number>,
  risk_class_distribution: Record<string, number>,   // "0"/"1"/"2"
  monthly_trends: Record<string, number>,            // "YYYY-MM" → count

  // Arrays
  hotspot_locations: HotspotLocation[],              // up to 1000
  alerts: Alert[],                                   // up to 500
  spatiotemporal_clusters: SpatiotemporalCluster[]
}
```

**HotspotLocation**
```ts
{
  lat: number,
  lng: number,
  frequency: number,     // always 1 (hardcoded in export_dashboard_summary)
  crime_type: string,
  severity: string       // LOW / HIGH / CRITICAL
}
```

**Alert**
```ts
{
  district: string,
  crime_category: string,
  alert_level: "NORMAL" | "ELEVATED" | "CRITICAL",
  current_count: number,
  historical_avg: number,    // ≈ 1.0 due to pipeline bug PY-03
  percent_change: number,    // very large due to same bug
  trend_direction: "up" | "down" | "stable"
}
```

**SpatiotemporalCluster**
```ts
{
  lat: number,
  lng: number,
  time_bucket: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT" | "UNKNOWN",
  frequency: number,
  crime_categories: Record<string, number>,   // top 3
  severity_level: string
}
```

---

### 2.2 network_data.json

```ts
{
  nodes: Array<{
    id: string,
    group: "crime_type" | "district" | "syndicate",
    size: number          // FIR count for that node
  }>,
  edges: Array<{
    source: string,       // node id
    target: string,       // node id
    weight: number        // co-occurrence count
  }>
}
```

**Node groups:**
- `crime_type` — a crime category name (e.g. "MURDER")
- `district` — a district name (e.g. "BENGALURU DIST")
- `syndicate` — prefixed `"SYNDICATE_<district>"` for repeat offenders

---

### 2.3 forecast_data.json

Array of forecasts for the top 5 crime categories.

```ts
Array<{
  crime_category: string,
  historical: Record<string, number>,   // "YYYY-MM" → count (last 12 months)
  predicted: number[],                  // 6 future values (linear regression)
  trend_direction: "up" | "down"
}>
```

**Forecast method:** `numpy.polyfit(x, counts, deg=1)` — simple linear regression over all historical months. Negative predictions are clamped to 0.

---

### 2.4 socioeconomic_data.json

Array of per-district records.

```ts
Array<{
  district: string,
  crime_rate_per_100k: number,
  total_firs: number,
  top_crimes: Record<string, number>,        // top 5 crime types
  severity_breakdown: Record<string, number>,
  socioeconomic_indicators: {
    population_density_per_km2: number,
    urbanization_percent: number,
    literacy_rate_percent: number,
    avg_annual_income_inr: number
  }
}>
```

> Note: Indicators are real for 4 districts only; all others use `{300, 50, 75, 100000}` defaults.

---

## 3. DataFrame Column Schema

The in-memory DataFrame that flows through the pipeline accumulates these columns:

### From source / mock data

| Column | Type | Values | Notes |
|--------|------|--------|-------|
| `fir_number` | str | FIR-STATION-NNNN | Unique identifier |
| `station_name` | str | Station name | |
| `date_reported` | date | YYYY-MM-DD | |
| `crime_time` | str | HH:MM | |
| `description` | str | free text | Needed for ML classifier |
| `status` | str | Open / Closed | |
| `source_file` | str | CSV filename | |
| `CrimeGroup_Name` | str | UPPERCASE | Crime category |
| `District_Name` | str | UPPERCASE | Karnataka district |
| `Latitude` | float | 0.0 or valid | 0.0 = unknown |
| `Longitude` | float | 0.0 or valid | 0.0 = unknown |
| `FIR_YEAR` | int | e.g. 2023 | |
| `FIR_MONTH` | int | 1–12 | |

### Added by Stage 5 (Analytical)

| Column | Type | Values |
|--------|------|--------|
| `Time_Bucket` | str | MORNING / AFTERNOON / EVENING / NIGHT / UNKNOWN |
| `Severity_Level` | str | LOW / HIGH / CRITICAL |
| `Severity_Score` | float | 0.0–1.0 |

### Added by Stage 6 (Graph)

| Column | Type | Values |
|--------|------|--------|
| `Location_Recurrence_Count` | int | ≥ 0 |
| `Syndicate_Link_Flag` | int | 0 or 1 |
| `Modus_Operandi_Cluster` | str | CrimeGroup + '_' + District |

### Added by Stage 7 (ML)

| Column | Type | Values |
|--------|------|--------|
| `Is_Historical_Archive` | int | 0 or 1 |
| `Is_Noisy_Record` | int | 0 or 1 |
| `Hotspot_Flag` | int | 0 or 1 |
| `Predicted_Risk_Class` | int | 0 (Low) / 1 (High) / 2 (Critical) |

### Added by Stage 8 (Alert)

| Column | Type | Values |
|--------|------|--------|
| `Spatiotemporal_Key` | str | District_TimeBucket_lat_lng |
| `Cluster_Frequency` | int | ≥ 1 |
| `Is_Spatiotemporal_Hotspot` | int | 0 or 1 (threshold ≥ 3) |
| `Anomaly_Score` | float | negative float (IsolationForest) |
| `Is_Anomaly` | int | 0 or 1 |
| `Alert_Level` | str | NORMAL / ELEVATED / CRITICAL |
| `Percent_Change` | float | % change vs historical |
| `Trend_Direction` | str | up / down / stable |
| `Historical_Avg` | float | ≈ 1.0 (bug) |
| `period` | str | YYYY-MM |

### Added by Stage 9 (Classification)

| Column | Type | Values |
|--------|------|--------|
| `predicted_category` | str | Violent / Financial / Cyber / Property / Drug-related / UNKNOWN |
| `confidence` | float | 0.0–1.0 (0.0 when classifier skipped) |

---

## 4. TypeScript Types (Frontend)

**File:** `client/src/types.ts`

```ts
interface CrimeSummary { /* matches dashboard_summary.json root */ }
interface HotspotLocation { lat, lng, frequency, crime_type, severity }
interface Alert { district, crime_category, alert_level, current_count, historical_avg, percent_change, trend_direction }
interface SpatiotemporalCluster { lat, lng, time_bucket, frequency, crime_categories, severity_level }
interface NetworkNode { id, group, size }
interface NetworkEdge { source, target, weight }
interface NetworkData { nodes: NetworkNode[], edges: NetworkEdge[] }
interface Forecast { crime_category, historical, predicted, trend_direction }
interface SocioEconomic { district, crime_rate_per_100k, total_firs, top_crimes, severity_breakdown, socioeconomic_indicators }
interface FIRRecord { id, fir_number, crime_type, severity, latitude, longitude, district }
```
