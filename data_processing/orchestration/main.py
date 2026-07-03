#!/usr/bin/env python3
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline_orchestrator import run_pipeline


def main():
    parser = argparse.ArgumentParser(
        description="CrimeDNA Intelligence Pipeline — ingest, analyze, classify, and visualize FIR data"
    )

    parser.add_argument(
        "--run", action="store_true",
        help="Run the full intelligence pipeline"
    )
    parser.add_argument(
        "--all", action="store_true",
        help="Generate mock data and run the full pipeline"
    )
    parser.add_argument(
        "--generate-mock", action="store_true",
        help="Generate mock FIR CSV datasets only"
    )
    parser.add_argument(
        "--source", choices=["real", "mock"], default="real",
        help="Data source: 'real' (Kaggle FIR dataset) or 'mock' (generated)"
    )
    parser.add_argument(
        "--limit", type=int, default=None,
        help="Number of rows to load from the real dataset (default: all)"
    )
    parser.add_argument(
        "--no-analysis", action="store_true",
        help="Skip analytical, graph, ML, and alert layers (ingestion only)"
    )
    parser.add_argument(
        "--no-classification", action="store_true",
        help="Skip ML category classification"
    )

    args = parser.parse_args()

    if len(sys.argv) == 1:
        parser.print_help()
        print()
        print("Examples:")
        print("  python main.py --run --source real --limit 50000")
        print("  python main.py --run --source mock")
        print("  python main.py --all")
        print("  python main.py --generate-mock")
        print("  python main.py --run --no-analysis --no-classification")
        return

    if args.generate_mock:
        from src.ingestion.filtering.data_generation import generate_all_mock_firs
        print("Generating mock FIR datasets...")
        generate_all_mock_firs()
        print("Done.")
        return

    if args.all:
        run_pipeline(
            source='mock',
            generate_mock=True,
            with_analysis=not args.no_analysis,
            with_classification=not args.no_classification,
        )
    elif args.run:
        run_pipeline(
            source=args.source,
            limit=args.limit,
            with_analysis=not args.no_analysis,
            with_classification=not args.no_classification,
        )
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
