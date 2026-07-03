import os
import glob
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from src.ingestion.filtering.config import DATA_DIR, LABELED_DATA_PATH, TARGET_CATEGORIES


def load_all_firs(data_dir=None):
    if data_dir is None:
        data_dir = DATA_DIR

    pattern = os.path.join(data_dir, "*.csv")
    files = sorted(glob.glob(pattern))

    if not files:
        raise FileNotFoundError(
            f"No CSV files found in {data_dir}.\n"
            "Run 'python main.py --generate-mock' first."
        )

    dataframes = {}
    for filepath in files:
        filename = os.path.basename(filepath)
        df = pd.read_csv(filepath)
        df["source_file"] = filename
        dataframes[filename] = df
        print(f"  [+] Loaded {filename} ({len(df)} rows)")

    return dataframes


def aggregate_datasets(dataframes):
    if not dataframes:
        raise ValueError("No dataframes to aggregate")

    combined = pd.concat(
        [df for df in dataframes.values()],
        ignore_index=True,
    )

    print(
        f"  [+] Aggregated {len(dataframes)} sources "
        f"into {len(combined)} total records"
    )
    return combined


def _load_training_data(path=None):
    if path is None:
        path = LABELED_DATA_PATH

    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Labeled training data not found at '{path}'.\n\n"
            "Create a CSV with the following format and place it there:\n"
            "description,category\n"
            '"Armed robbery at bank with shotgun",Violent\n'
            '"Phishing email targeting employee credentials",Cyber\n'
            '"Check forgery worth 2 lakh rupees",Financial\n'
            "..."
        )

    df = pd.read_csv(path)
    required = {"description", "category"}
    if not required.issubset(df.columns):
        raise ValueError(
            f"Labeled CSV must have columns: {required}. "
            f"Found columns: {list(df.columns)}"
        )

    df = df.dropna(subset=["description", "category"])
    if len(df) < 5:
        raise ValueError(
            f"Need at least 5 labeled examples; got {len(df)}"
        )

    return df["description"], df["category"]


def _build_classifier():
    return Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    max_features=5000,
                    ngram_range=(1, 2),
                    stop_words="english",
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    max_iter=1000,
                    random_state=42,
                ),
            ),
        ]
    )


def train_classifier(labeled_path=None):
    X_train, y_train = _load_training_data(labeled_path)
    pipeline = _build_classifier()
    pipeline.fit(X_train, y_train)
    categories = list(pipeline.named_steps["clf"].classes_)
    print(
        f"  [+] Classifier trained on {len(X_train)} examples, "
        f"categories: {categories}"
    )
    return pipeline


def classify_and_filter(pipeline, df, text_column="description"):
    texts = df[text_column].fillna("")

    if texts.empty:
        df["predicted_category"] = None
        df["confidence"] = None
        return df, df.iloc[0:0]

    probabilities = pipeline.predict_proba(texts)
    predictions = pipeline.predict(texts)

    df = df.copy()
    df["predicted_category"] = predictions
    df["confidence"] = probabilities.max(axis=1)

    mask = df["predicted_category"].isin(TARGET_CATEGORIES)
    filtered = df[mask].copy()
    discarded = df[~mask].copy()

    print(
        f"  [+] Classification complete: {len(filtered)} kept, "
        f"{len(discarded)} discarded"
    )
    return filtered, discarded
