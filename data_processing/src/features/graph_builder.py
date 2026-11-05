# Graph construction utilities (not currently used — network data is built in pipeline_orchestrator.py)

def build_adjacency(df, source_col, target_col):
    """Return a list of (source, target, weight) tuples from co-occurrence counts."""
    pairs = df.groupby([source_col, target_col]).size().reset_index(name='weight')
    return list(pairs.itertuples(index=False, name=None))
