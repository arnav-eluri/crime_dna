#!/usr/bin/env python3
import argparse
import sys

from pipeline_orchestrator import run_pipeline


def main():
    parser = argparse.ArgumentParser(
        description="Crime Data Pipeline — aggregate, classify, and store FIR records"
    )
    parser.add_argument(
        "--generate-mock",
        action="store_true",
        help="Generate mock FIR CSV datasets for testing",
    )
    parser.add_argument(
        "--run",
        action="store_true",
        help="Run the full pipeline (load, aggregate, classify, store)",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Generate mock data and run the full pipeline",
    )

    args = parser.parse_args()

    if len(sys.argv) == 1:
        parser.print_help()
        return

    if args.all:
        run_pipeline(generate_mock=True)
    elif args.generate_mock:
        from data_generation import generate_all_mock_firs

        print("Generating mock FIR datasets...")
        generate_all_mock_firs()
        print("Done.")
    elif args.run:
        run_pipeline(generate_mock=False)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
