import pandas as pd
from typing import List, Callable, Dict, Any

class FilterEngine:
    """
    A dynamic multi-layer filtering engine that chains filter operations on a pandas DataFrame.
    """
    def __init__(self, data: pd.DataFrame):
        self.df = data.copy()
        self.filters: List[Callable] = []
        self.config: Dict[str, Any] = {}

    def load_config(self, config: Dict[str, Any]):
        """Load JSON/Dict configuration for filters."""
        self.config = config
        return self

    def add_filter(self, filter_func: Callable, **kwargs):
        """
        Add a filter to the execution chain.
        The filter_func must accept a DataFrame and return a DataFrame.
        """
        def wrapped_filter(df):
            return filter_func(df, **kwargs)
        self.filters.append(wrapped_filter)
        return self

    def add_filters(self, filter_funcs: List[Callable]):
        """Add multiple filters sequentially."""
        for f in filter_funcs:
            self.add_filter(f)
        return self

    def run(self) -> pd.DataFrame:
        """Execute the chained filters."""
        for f in self.filters:
            self.df = f(self.df)
        return self.df

    def get_data(self) -> pd.DataFrame:
        return self.df
