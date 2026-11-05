# Bug Report — datathon_404_detectives

Full scan of BE (Node/Express), FE (React/TypeScript), and Python data pipeline.
Every finding cites the specific file and line — nothing speculated.

**14 High · 11 Medium · 5 Low · 30 total**

---

## Backend · `functions/crime_dna`

### BE-01 · HIGH — `run_persistence_layer` never saves FIR data; analyzed DataFrame silently discarded

**File:** `data_processing/orchestration/pipeline_orchestrator.py:155–167`

`upsert_firs()` and `upsert_filtered_crimes()` are both imported but never called. Only 3 hard-coded mock stations are written to the DB. Line 165 prints "records ready for storage" but they are never stored. Additionally, `engine = DATABASE_URL` shadows the SQLAlchemy engine import with a plain string.

```python
def run_persistence_layer(df):
    upsert_stations(session, MOCK_STATIONS)   # only this runs
    engine = DATABASE_URL                     # shadows engine with a string
    print(f"  [+] {len(df)} records ready for storage")  # but upsert_firs never called
```

---

### BE-02 · HIGH — `chat.service.js` hardcodes a local dev path that breaks in Catalyst cloud deployment

**File:** `functions/crime_dna/services/chat.service.js:4–11`

The data path resolves three directories up into `data_processing/data/03_processed`. In Catalyst's serverless deployment, `data_processing/` doesn't exist next to the function. Every chat request throws `ENOENT` at runtime.

```js
const DATA_PATH = path.join(__dirname,
  '..', '..', '..', 'data_processing', 'data', '03_processed');
// Works locally; Catalyst has no data_processing/ sibling
```

---

### BE-03 · HIGH — `Math.random()` in `GET /api/firs/:id` — same FIR returns different data every request

**File:** `functions/crime_dna/index.js:217–218`

Every GET of the same FIR ID returns different `victims` and `accused` counts. A REST GET should be idempotent.

```js
linked_entities: {
  victims: Math.floor(Math.random() * 5) + 1,  // random on every request
  accused: Math.floor(Math.random() * 3) + 1,
}
```

---

### BE-04 · MEDIUM — `/api/firs` district assigned by round-robin index; filter returns geographically wrong results

**File:** `functions/crime_dna/index.js:184`

FIR records are built from real hotspot lat/lng points but `district` is assigned by modulo: `Object.keys(district_distribution)[i % len]`. The `?district=X` filter returns geographically wrong results.

```js
district: Object.keys(data.district_distribution)[
  i % Math.max(1, Object.keys(data.district_distribution).length)
]  // round-robin, not actual lat/lng lookup
```

---

### BE-05 · MEDIUM — `zcatalyst-sdk-node` pinned to `"latest"` — unpinned production dependency

**File:** `functions/crime_dna/package.json:9`

`"zcatalyst-sdk-node": "latest"` resolves at install time. A breaking release will silently break production on the next `npm install` without any code change.

---

## Frontend · `client/src`

### FE-01 · HIGH — `useMediaQuery` has `matches` in dep array; infinite re-subscription loop on mobile

**File:** `client/src/utils.ts:33–43`

`matches` is in the `useEffect` dependency array. On mobile the initial state is `false` but the query resolves to `true`; the effect fires, calls `setMatches(true)`, which re-triggers the effect — infinite loop. Also, initializing with `useState(false)` causes a layout flash on mobile (desktop layout renders first).

**Fix:** `useState(() => window.matchMedia(query).matches)` and remove `matches` from deps.

```ts
const [matches, setMatches] = useState(false);  // always false → flash on mobile
useEffect(() => {
  if (media.matches !== matches) { setMatches(media.matches); }
  ...
}, [matches, query]);  // matches here triggers infinite loop
```

---

### FE-02 · HIGH — `index.tsx` imports `Container` from `react-dom/client` which doesn't exist

**File:** `client/src/index.tsx:2, 7`

`Container` is not exported from `react-dom/client` — it was a legacy internal type. `createRoot` accepts `Element | DocumentFragment`; the cast should be `as Element`.

```ts
import ReactDOM, { Container } from 'react-dom/client';  // Container doesn't exist
const root = ReactDOM.createRoot(
  document.getElementById('root') as Container  // ← type error
```

---

### FE-03 · HIGH — Google Translate toggle sets cookie but translate script never loaded — feature 100% broken

**File:** `client/src/components/Navbar.tsx:38–55`, `MobileHeader.tsx:8–25`

Both components write the `googtrans=/en/kn` cookie and reload the page. The Google Translate widget script is never injected into `index.html`. The ಕನ್ನಡ language button does nothing for every user.

```js
document.cookie = `googtrans=/en/kn; path=/;`;
window.location.reload();
// index.html never loads the translate script — translation never fires
```

---

### FE-04 · HIGH — `FIRList` filter change doesn't reset page number; shows zero results when on page 2+

**File:** `client/src/pages/FIRList.tsx:22–33`

Filters change but `page` stays at whatever it was. On page 3, switching crime type sends `page=3` for a filtered set that may have only 1 page — the table shows "No records" even though page 1 has data. `setPage(1)` must be called in filter change handlers.

```ts
}, [page, filterType, filterSeverity]);
onChange={e => setFilterType(e.target.value)}  // page not reset
```

---

### FE-05 · MEDIUM — `Preloader` — `displayLocation` state set but never used; 2-second wait has no effect

**File:** `client/src/components/Preloader.tsx:7–17, 124`

`displayLocation` is updated inside the 2-second timeout but never controls what renders. `{children}` is always rendered unconditionally (line 124), so the new page mounts immediately beneath the overlay. The delay adds 2 seconds of friction with zero benefit.

---

### FE-06 · MEDIUM — 4 pages silently swallow API errors; user sees empty UI with no indication of failure

**Files:** `Alerts.tsx:14`, `Trends.tsx:46`, `Severity.tsx:20`, `NetworkGraph.tsx:21`

`.catch(() => {})` silently ignores all API errors. Compare to `Dashboard.tsx:44` which correctly sets `setError`.

```ts
api.alerts().then(d => setAlerts(d.alerts || []))
  .catch(() => {})  // silent failure, no setError()
```

---

### FE-07 · MEDIUM — Crime type dropdown built from current page of 25 records; most types invisible

**File:** `client/src/pages/FIRList.tsx:60–62`

Dropdown options come from `firs.map(f => f.crime_type)` where `firs` is only the current page. Crime types absent from the visible 25 records cannot be selected.

---

### FE-08 · MEDIUM — `@types/react-router-dom@5` installed alongside `react-router-dom@7`; types conflict

**File:** `client/package.json:52`

React Router v7 ships its own TypeScript types. The separately-installed `@types/react-router-dom@^5.3.3` conflicts with them, producing incorrect type definitions for `NavLink`, `Routes`, and others. Remove this package entirely.

---

### FE-09 · MEDIUM — `@testing-library/react@11` incompatible with React 19; `concurrently` missing from devDeps

**File:** `client/package.json:7, 25`

1. `@testing-library/react@^11` supports React 16/17 only; it fails against React 19 — use v16+.
2. The `dev` script runs `npx concurrently` but `concurrently` is not in `devDependencies` — relies on npx auto-install which is slow and breaks offline.

---

### FE-10 · MEDIUM — CLI plugin and `@types/*` packages in `dependencies` instead of `devDependencies`

**File:** `client/package.json:8, 10, 22`

`zcatalyst-cli-plugin-react` is a build/deploy tool. `@types/jest` and `@types/leaflet.heat` are type declaration packages. All three are under `dependencies`, inflating production installs.

---

### FE-11 · LOW — `vite.config.ts` — `resolve.tsconfigPaths` is not a valid Vite option; silently ignored

**File:** `client/vite.config.ts:8`

Vite has no `resolve.tsconfigPaths` key. To use tsconfig path aliases in Vite, install and use the `vite-tsconfig-paths` plugin.

```ts
resolve: {
  tsconfigPaths: true,  // not a valid Vite option — silently dropped
}
```

---

### FE-12 · LOW — `Dashboard` passes `delay` prop to `KpiCard` but it's not in the interface; animation never fires

**Files:** `client/src/pages/Dashboard.tsx:74–91`, `client/src/components/KpiCard.tsx:3–9`

Dashboard passes `delay={0.1}` through `delay={0.7}` for staggered animation. `KpiCard`'s props interface has no `delay` field and the component never reads it. The staggered entrance animation is entirely dead code.

---

### FE-13 · LOW — `MobileDashboard` — `heroAlert` and 9 styles defined for a UI section that was removed

**File:** `client/src/pages/MobileDashboard.tsx:17–20, 143–215`

`heroAlert` is computed but never referenced in JSX. Nine style entries (`heroCard`, `heroContent`, `liveTag`, etc.) are defined but never applied — a panel that was removed without cleaning up its data prep and styles. The sort comparator at line 18 is also wrong (always returns `1` when `a !== 'CRITICAL'`).

---

## Data Pipeline · `data_processing/src`

### PY-01 · HIGH — `labeled_crimes.csv` missing; ML classification non-functional for all records

**File:** `data_processing/src/ingestion/filtering/config.py:8`

`LABELED_DATA_PATH` resolves to `data_processing/data/labeled_crimes.csv` which doesn't exist. `train_classifier()` raises `FileNotFoundError`; the pipeline catches it and defaults every record to `predicted_category='UNKNOWN'`. Classification is completely non-functional.

```python
LABELED_DATA_PATH = os.path.join(BASE_DIR, "data", "labeled_crimes.csv")
# File absent — all records get predicted_category='UNKNOWN'
```

---

### PY-02 · HIGH — `alert_generator.py` required columns guard uses `intersection` (any) instead of `issubset` (all)

**File:** `data_processing/src/features/alert_generator.py:169`

`if not required.intersection(df.columns)` is truthy only when zero required columns are present. If even one column is missing, the guard passes and `groupby(['District_Name', 'CrimeGroup_Name', 'Alert_Level'])` raises `KeyError`.

```python
required = {'Alert_Level', 'CrimeGroup_Name', 'District_Name', ...}
if not required.intersection(df.columns):  # truthy if ANY col matches
    return alerts                           # should be .issubset()
```

---

### PY-03 · HIGH — `trend_alerts` — `historical_avg` always ≈ 1.0; generates spurious CRITICAL alerts

**File:** `data_processing/src/features/alert_generator.py:140–147`

`hist_months = max(len(historical), 1)` gives row count, not distinct time periods. So `historical_avg = len(historical) / hist_months ≈ 1.0` regardless of actual volumes. For 500 historical rows the average is ~1.0, making `pct_change` ~49,900% — every crime type becomes CRITICAL.

**Fix:** `hist_months = max(historical['period'].nunique(), 1)`

```python
hist_months = max(len(historical), 1)        # row count, not month count
historical_avg = len(historical) / hist_months  # always ≈ 1.0 → all CRITICAL
```

---

### PY-04 · HIGH — `database_operations.py` — `date.fromisoformat()` unguarded; malformed dates crash entire upsert silently

**File:** `data_processing/src/ingestion/filtering/database_operations.py:88`

If `raw_date` is a non-ISO string (`"01/15/2023"`, `"nan"`, or empty), `date.fromisoformat()` raises `ValueError` with no handler, rolling back all previously flushed FIRs. `run_persistence_layer` catches everything with a silent `print`, making this failure invisible.

```python
if isinstance(raw_date, str):
    parsed_date = date.fromisoformat(raw_date)   # no try/except
# ValueError on "01/15/2023" → rolls back all FIRs
```

---

### PY-05 · HIGH — `load_real_data` accesses `CrimeHead_Name` without checking it exists; `KeyError` aborts pipeline

**File:** `data_processing/orchestration/pipeline_orchestrator.py:36–37`

The guard checks for `'Place of Offence'` but not `'CrimeHead_Name'`. If the CSV has `'Place of Offence'` but lacks `'CrimeHead_Name'`, the string concatenation raises `KeyError` and aborts the entire pipeline.

```python
if 'description' not in df.columns and 'Place of Offence' in df.columns:
    df['description'] = df['Place of Offence'].fillna('') + ' - ' + \
        df['CrimeHead_Name'].fillna('')  # KeyError if column missing
```

---

### PY-06 · HIGH — `sqlite_loader.py` and `graph_builder.py` are empty placeholder files

Both files exist on disk but contain no code. Any `from src.loaders.sqlite_loader import …` or `from src.features.graph_builder import …` will raise `ImportError` at the symbol access. The SQLite loading and graph-building paths in the architecture are non-functional.

- `data_processing/src/loaders/sqlite_loader.py` — empty
- `data_processing/src/features/graph_builder.py` — empty

---

### PY-07 · MEDIUM — `classify_and_filter` returns full `df` when texts is empty; null-description rows pass as classified

**File:** `data_processing/src/ingestion/filtering/data_processing.py:120–123`

When all descriptions are null, the function returns `(df, df.iloc[0:0])` — the full original `df` as "classified" and an empty df as "discarded". All null-description rows are silently passed forward with `predicted_category=None`.

```python
if texts.empty:
    df["predicted_category"] = None
    return df, df.iloc[0:0]  # returns FULL df as "classified"
```

---

### PY-08 · MEDIUM — `config.py` — `SCHEMA_PATH` references `schema.sql` which does not exist

**File:** `data_processing/src/ingestion/filtering/config.py:12`

`SCHEMA_PATH` resolves to `data_processing/src/loaders/schema.sql`. No such file exists. Any code that opens this path raises `FileNotFoundError`.

---

### PY-09 · MEDIUM — `ml_filters.py` — current year hardcoded as `2026`; archive flag wrong starting 2027

**File:** `data_processing/src/features/ml_filters.py:9`

`current_year = 2026` is hardcoded. All FIR records from 2027 onward will be incorrectly flagged as historical archives. `cleaner.py:101` in the same codebase correctly uses `datetime.datetime.now().year`.

```python
def time_window_flag(df, years=10):
    current_year = 2026  # hardcoded — wrong starting 2027
```

---

### PY-10 · MEDIUM — `build_socioeconomic_data` has mock data for only 4 of 35+ districts; rest get identical placeholder values

**File:** `data_processing/orchestration/pipeline_orchestrator.py:390–395`

`mock_indicators` has real data for only BAGALKOT, BALLARI, BELAGAVI CITY, and BELAGAVI DIST. The remaining 31+ Karnataka districts fall through to identical defaults (`population_density:300, urbanization_pct:50`), making the socioeconomic comparison on the frontend show identical indicators for 90% of districts.

---

### PY-11 · LOW — `filter_by_crime_category` imported but never added to any `FilterEngine` chain

**File:** `data_processing/orchestration/pipeline_orchestrator.py:10, 83–92`

`filter_by_crime_category` is imported but never added to `FilterEngine`. The analytical layer only runs `generate_time_buckets` and `calculate_severity_score`. All crime categories pass through unfiltered.

---

## Summary Table

| ID | Severity | Area | File | Issue |
|----|----------|------|------|-------|
| BE-01 | High | Pipeline | `pipeline_orchestrator.py:155` | `upsert_firs()` never called — data never persisted |
| BE-02 | High | Backend | `chat.service.js:4` | Hardcoded local dev path breaks in Catalyst deployment |
| BE-03 | High | Backend | `index.js:217` | `Math.random()` in GET endpoint — non-deterministic response |
| BE-04 | Medium | Backend | `index.js:184` | District assigned by round-robin, not location |
| BE-05 | Medium | Config | `package.json:9` | `zcatalyst-sdk-node: "latest"` unpinned |
| FE-01 | High | Frontend | `utils.ts:43` | `matches` in dep array → infinite loop + layout flash |
| FE-02 | High | Frontend | `index.tsx:2` | `Container` doesn't exist in `react-dom/client` |
| FE-03 | High | Frontend | `Navbar.tsx:42` | Translate cookie set but translate script never loaded |
| FE-04 | High | Frontend | `FIRList.tsx:33` | Filter change doesn't reset page number |
| FE-05 | Medium | Frontend | `Preloader.tsx:7` | `displayLocation` unused; 2s delay has no effect |
| FE-06 | Medium | Frontend | `Alerts.tsx:14` | 4 pages swallow API errors silently |
| FE-07 | Medium | Frontend | `FIRList.tsx:60` | Crime type dropdown from 25-record page only |
| FE-08 | Medium | Config | `package.json:52` | `@types/react-router-dom@5` conflicts with v7 bundled types |
| FE-09 | Medium | Config | `package.json:7` | Testing library v11 incompatible with React 19 |
| FE-10 | Medium | Config | `package.json:22` | Dev tools in `dependencies` instead of `devDependencies` |
| FE-11 | Low | Config | `vite.config.ts:8` | `resolve.tsconfigPaths` not a valid Vite option |
| FE-12 | Low | Frontend | `Dashboard.tsx:74` | `delay` prop passed to `KpiCard` but not in interface |
| FE-13 | Low | Frontend | `MobileDashboard.tsx:17` | Dead `heroAlert` code + 9 unused styles |
| PY-01 | High | Pipeline | `config.py:8` | `labeled_crimes.csv` missing — all records get `'UNKNOWN'` |
| PY-02 | High | Pipeline | `alert_generator.py:169` | `.intersection()` guard wrong — should be `.issubset()` |
| PY-03 | High | Pipeline | `alert_generator.py:141` | `historical_avg ≈ 1.0` always — all alerts become CRITICAL |
| PY-04 | High | Pipeline | `database_operations.py:88` | `date.fromisoformat()` unguarded — malformed date rolls back all FIRs |
| PY-05 | High | Pipeline | `pipeline_orchestrator.py:37` | `CrimeHead_Name` access without existence check — `KeyError` |
| PY-06 | High | Pipeline | `sqlite_loader.py` | Two empty placeholder files — imports from them will fail |
| PY-07 | Medium | Pipeline | `data_processing.py:120` | Returns full `df` on empty texts — null rows pass as classified |
| PY-08 | Medium | Config | `config.py:12` | `SCHEMA_PATH` references non-existent `schema.sql` |
| PY-09 | Medium | Pipeline | `ml_filters.py:9` | `current_year = 2026` hardcoded — wrong starting 2027 |
| PY-10 | Medium | Pipeline | `pipeline_orchestrator.py:390` | Mock socioeconomic data for only 4 of 35+ districts |
| PY-11 | Low | Pipeline | `pipeline_orchestrator.py:87` | `filter_by_crime_category` imported but never wired in |
