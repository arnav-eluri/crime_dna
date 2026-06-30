# 404 Detectives - Datathon

## Problem Statement

<div align="center">
  <img src="./images/ksp_logo.jpeg" alt="KSP Logo" width="15%" />
</div>

The **Karnataka State Police (KSP)** currently manages crime data through fragmented, manual, and Excel-based systems, resulting in isolated records and limited analytical capability. This siloed approach restricts the ability to perform integrated, state-wide analysis and prevents the discovery of deeper criminal patterns, networks, and trends.

As a result, policing remains largely **reactive** rather than proactive, with minimal use of advanced analytics or AI to support decision-making. The **State Crime Records Bureau (SCRB)** lacks tools for real-time visualization, predictive insights, and network-based crime intelligence, making it difficult to identify hotspots, track repeat offenders, or uncover hidden associations between cases.

There is a critical need for an intelligent, AI-driven platform that integrates crime data across jurisdictions and enables advanced analytics, geospatial visualization, network analysis, and predictive modeling to support proactive and evidence-based policing.

## File Structure

```text
datathon_404_detectives/
├── main.py                     # CLI: --generate-mock, --run, --all
├── config.py                   # DB path, categories, station config
├── data_generation.py          # Generates mock FIRs
├── data_processing.py          # Reads CSVs, aggregates, trains classifier, and filters
├── database_operations.py      # SQLAlchemy ORM, engine, session, upserts
├── pipeline_orchestrator.py    # End-to-end: load → aggregate → classify → store
├── requirements.txt            # pandas, scikit-learn, sqlalchemy
├── data/
│   ├── labeled_crimes.csv      # Your 60-example training set
│   └── firs/                   # Generated mock CSVs
└── crime_pipeline.db           # Created at runtime
```

## How to use

1. **Generate mock FIR data only**
```bash
python main.py --generate-mock
```

2. **Full pipeline (requires labeled_crimes.csv)**
```bash
python main.py --run
```

3. **Generate + run together**
```bash
python main.py --all
```


#### Contributors 

1. Arnav Eluri - Reva University, Bengaluru - KA 
2. Aryan Keshri - Acharaya Institute of Technology, Bengaluru - KA
3. Ruhi Sharma - Reva University, Bengaluru - KA
