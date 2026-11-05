# API Reference — CrimeDNA

**Base URL (dev):** `http://localhost:9000`  
**Base URL (prod):** `/server/crime_dna`

All endpoints return `application/json`. All are `GET` with CORS `*`.

---

## GET /api/health

Returns server status and available endpoint list.

**Response**
```json
{
  "status": "healthy",
  "data_available": true,
  "total_firs": 12543,
  "endpoints": ["/api/health", "/api/summary", "..."]
}
```

---

## GET /api/summary

Main dashboard data. All KPI values and distributions in one payload.

**Response** (`CrimeSummary`)
```json
{
  "total_firs": 12543,
  "active_cases": 8153,
  "hotspot_count": 342,
  "spatiotemporal_hotspot_count": 89,
  "critical_count": 1204,
  "anomaly_count": 67,
  "syndicate_link_count": 231,
  "crime_type_distribution": { "MURDER": 1230, "THEFT": 980, ... },
  "severity_distribution": { "LOW": 8000, "HIGH": 3000, "CRITICAL": 1543 },
  "district_distribution": { "BENGALURU DIST": 4200, ... },
  "risk_class_distribution": { "0": 8000, "1": 3000, "2": 1543 },
  "monthly_trends": { "2023-01": 450, "2023-02": 390, ... },
  "hotspot_locations": [ { "lat": 12.97, "lng": 77.59, "frequency": 1, "crime_type": "MURDER", "severity": "CRITICAL" }, ... ],
  "alerts": [ { "district": "BENGALURU DIST", "crime_category": "THEFT", "alert_level": "CRITICAL", ... }, ... ],
  "spatiotemporal_clusters": [ { "lat": 12.97, "lng": 77.59, "time_bucket": "EVENING", "frequency": 12, ... }, ... ]
}
```

---

## GET /api/trends

Monthly crime trends and distributions.

**Response**
```json
{
  "monthly_trends": { "2023-01": 450, ... },
  "crime_type_distribution": { "MURDER": 1230, ... },
  "district_distribution": { "BENGALURU DIST": 4200, ... }
}
```

---

## GET /api/hotspots

Hotspot counts and location list.

**Response**
```json
{
  "hotspot_count": 342,
  "spatiotemporal_hotspot_count": 89,
  "locations": [
    { "lat": 12.97, "lng": 77.59, "frequency": 1, "crime_type": "MURDER", "severity": "CRITICAL" }
  ],
  "clusters": [
    { "lat": 12.97, "lng": 77.59, "time_bucket": "EVENING", "frequency": 12, "crime_categories": {...}, "severity_level": "HIGH" }
  ]
}
```

---

## GET /api/severity

Severity and risk class breakdowns.

**Response**
```json
{
  "severity_distribution": { "LOW": 8000, "HIGH": 3000, "CRITICAL": 1543 },
  "risk_class_distribution": { "0": 8000, "1": 3000, "2": 1543 },
  "critical_count": 1543
}
```

---

## GET /api/alerts

Alert list with optional filters.

**Query Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `district` | string | Filter by district name (case-insensitive) |
| `level` | string | Filter by alert level: `NORMAL`, `ELEVATED`, `CRITICAL` |

**Response**
```json
{
  "total_alerts": 150,
  "critical_count": 23,
  "elevated_count": 67,
  "alerts": [
    {
      "district": "BENGALURU DIST",
      "crime_category": "THEFT",
      "alert_level": "CRITICAL",
      "current_count": 450,
      "historical_avg": 1.0,
      "percent_change": 44900.0,
      "trend_direction": "up"
    }
  ]
}
```

> Note: `historical_avg` is incorrect due to a pipeline bug (see BUG_REPORT.md PY-03). Values are approximately 1.0 for all entries.

---

## GET /api/anomalies

Anomaly detection summary.

**Response**
```json
{
  "anomaly_count": 67,
  "total_firs": 12543,
  "anomaly_rate": "0.53"
}
```

---

## GET /api/network

Crime network graph data for force-directed visualisation.

**Response** (`NetworkData`)
```json
{
  "nodes": [
    { "id": "MURDER", "group": "crime_type", "size": 1230 },
    { "id": "BENGALURU DIST", "group": "district", "size": 4200 },
    { "id": "SYNDICATE_BENGALURU DIST", "group": "syndicate", "size": 3 }
  ],
  "edges": [
    { "source": "MURDER", "target": "BENGALURU DIST", "weight": 420 }
  ]
}
```

**Node groups:** `crime_type`, `district`, `syndicate`

---

## GET /api/spatiotemporal

Spatiotemporal hotspot clusters.

**Response**
```json
{
  "clusters": [
    {
      "lat": 12.97,
      "lng": 77.59,
      "time_bucket": "EVENING",
      "frequency": 12,
      "crime_categories": { "MURDER": 5, "THEFT": 4, "HURT": 3 },
      "severity_level": "HIGH"
    }
  ],
  "total_clusters": 89
}
```

---

## GET /api/forecast

6-month forward projection per top-5 crime type (linear regression).

**Response** (`Forecast[]`)
```json
[
  {
    "crime_category": "MURDER",
    "historical": { "2023-01": 120, "2023-02": 115, ... },
    "predicted": [118, 122, 125, 119, 130, 128],
    "trend_direction": "up"
  }
]
```

---

## GET /api/associations

Network association data merged with syndicate stats.

**Response**
```json
{
  "syndicate_link_count": 231,
  "network_nodes": [...],
  "network_edges": [...]
}
```

---

## GET /api/offenders

Offender and anomaly summary.

**Response**
```json
{
  "syndicate_link_count": 231,
  "anomaly_count": 67,
  "total_firs": 12543
}
```

---

## GET /api/socioeconomic

Per-district socioeconomic indicators and crime breakdown.

**Response** (`SocioEconomic[]`)
```json
[
  {
    "district": "BAGALKOT",
    "crime_rate_per_100k": 42.3,
    "total_firs": 1230,
    "top_crimes": { "MURDER": 230, "THEFT": 180 },
    "severity_breakdown": { "LOW": 800, "HIGH": 300, "CRITICAL": 130 },
    "socioeconomic_indicators": {
      "population_density_per_km2": 250,
      "urbanization_percent": 28,
      "literacy_rate_percent": 68,
      "avg_annual_income_inr": 85000
    }
  }
]
```

> Note: Only 4 districts (BAGALKOT, BALLARI, BELAGAVI CITY, BELAGAVI DIST) have real indicators. All others get placeholder values (see BUG_REPORT.md PY-10).

---

## GET /api/firs

Paginated FIR record list.

**Query Parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | `1` | Page number |
| `limit` | integer | `50` | Records per page |
| `district` | string | — | Filter by district (case-insensitive) |
| `crime_type` | string | — | Filter by crime type (substring, case-insensitive) |
| `severity` | string | — | Filter by severity: `LOW`, `HIGH`, `CRITICAL` |

**Response**
```json
{
  "total": 342,
  "page": 1,
  "limit": 25,
  "total_pages": 14,
  "data": [
    {
      "id": 1,
      "fir_number": "FIR-000001",
      "crime_type": "MURDER",
      "severity": "CRITICAL",
      "latitude": 12.97,
      "longitude": 77.59,
      "district": "BENGALURU DIST"
    }
  ]
}
```

> Note: `district` is assigned by round-robin index, not by actual lat/lng. Filtering by district returns geographically incorrect results (see BUG_REPORT.md BE-04).

---

## GET /api/firs/:id

Single FIR detail by numeric ID.

**Path Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | integer | FIR record index (1-based) |

**Response**
```json
{
  "id": 1,
  "fir_number": "FIR-000001",
  "crime_type": "MURDER",
  "severity": "CRITICAL",
  "latitude": 12.97,
  "longitude": 77.59,
  "district": "BENGALURU DIST",
  "linked_entities": {
    "victims": 3,
    "accused": 1,
    "is_hotspot": true
  }
}
```

> Note: `victims` and `accused` are `Math.random()` — different on every request (see BUG_REPORT.md BE-03).

**Error Response (404)**
```json
{ "error": "FIR not found" }
```
