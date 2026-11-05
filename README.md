# Crime DNA

<div align="center">
  <img src="./images/ksp_logo.jpeg" alt="KSP Logo" width="20%" />
</div>

## Problem Statement

The **Karnataka State Police (KSP)** currently manages crime data through fragmented, manual, and Excel-based systems, resulting in isolated records and limited analytical capability. This siloed approach restricts the ability to perform integrated, state-wide analysis and prevents the discovery of deeper criminal patterns, networks, and trends.

As a result, policing remains largely **reactive** rather than proactive. The **State Crime Records Bureau (SCRB)** lacks tools for real-time visualization, predictive insights, and network-based crime intelligence, making it difficult to identify hotspots, track repeat offenders, or uncover hidden associations between cases.

## Solution

CrimeDNA is an AI-powered Crime Intelligence Platform that unifies crime data from multiple police sources and transforms it into a living behavioral intelligence network. Instead of treating each FIR as an isolated record, it analyzes behavioral patterns, modus operandi, locations, timelines, and relationships to create a unique "Crime DNA" for every incident.

<div align="center">
  <img src="./images/flowchart.png" alt="CrimeDNA Flowchart" width="60%" />
  <p><i>CrimeDNA Workflow Diagram</i></p>
</div>

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+

### One-command setup (Windows)

```powershell
.\dev.ps1
```

This script installs dependencies, runs the full 11-stage pipeline on mock data, and opens `http://localhost:5173`.

```powershell
# Skip pipeline if data already exists
.\dev.ps1 -SkipPipeline

# Use real Kaggle dataset, limit rows for speed
.\dev.ps1 -Real -Limit 5000
```

### Dataset

Download the real FIR dataset from Kaggle and place it at `data_processing/datasets/FIR_Details_Data.csv` before running with `-Real`:
[FIR Details - Karnataka Police Dataset](https://www.kaggle.com/datasets/vanshangaria/fir-details-karnataka-police)

### Manual steps

```powershell
# Python pipeline only
cd data_processing/orchestration
python main.py --all --no-classification

# UI only (after pipeline has run)
cd client
npm install
npm run dev
```

---

## Documentation

| Doc | Contents |
|-----|----------|
| [`docs/HLD.md`](docs/HLD.md) | High-level architecture, component overview, tech stack |
| [`docs/LLD.md`](docs/LLD.md) | Low-level design: pipeline stages, map rendering, API flow |
| [`docs/DATA_FLOW.md`](docs/DATA_FLOW.md) | End-to-end data flow from raw FIRs to dashboard |
| [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) | All 16 REST endpoints with request/response details |
| [`docs/PIPELINE_COMMANDS.md`](docs/PIPELINE_COMMANDS.md) | Full CLI reference for `main.py` |
| [`docs/SCHEMA.md`](docs/SCHEMA.md) | SQLite schema and JSON artifact reference |
| [`docs/aryan_keshri_todo.md`](docs/aryan_keshri_todo.md) | PDF dossier export feature spec |
| [`docs/ruhi_sharma_todo.md`](docs/ruhi_sharma_todo.md) | Bilingual voice chatbot feature spec |

---

## File Structure

```text
CrimeDNA/
├── dev.ps1                     # One-command dev launcher
├── client/                     # React frontend (TypeScript + Vite)
├── functions/crime_dna/        # Node.js backend (Zoho Catalyst)
│   └── data/                   # Pipeline output JSON served by API
├── data_processing/            # Python ML pipeline (11 stages)
│   ├── orchestration/          # main.py CLI + pipeline_orchestrator.py
│   └── src/                    # ingestion, features, loaders, utils
├── docs/                       # Architecture and API documentation
└── images/
```

---

## Contributors

1. **Arnav Eluri** — Reva University, Bengaluru, KA
   - Python data pipeline architecture, ML feature engineering, orchestration
2. **Aryan Keshri** — Acharya Institute of Technology, Bengaluru, KA
   - Frontend React dashboard, network graph visualization, PDF export planning
3. **Ruhi Sharma** — Reva University, Bengaluru, KA
   - Backend API design, voice chatbot architecture planning
4. **Spandana S R** — Reva University, Bengaluru, KA
   - Data ingestion, cleaning, and validation logic
