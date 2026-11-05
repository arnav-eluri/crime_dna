# SQLite bulk-loading utilities (not currently used — ORM path is in database_operations.py)

def load_dataframe_to_sqlite(df, table_name, engine):
    """Bulk-insert a DataFrame into a SQLite table via pandas to_sql."""
    df.to_sql(table_name, con=engine, if_exists='append', index=False)
