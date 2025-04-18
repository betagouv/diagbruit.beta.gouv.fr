#!/usr/bin/env python
import geopandas as gpd
from sqlalchemy import create_engine, text
import argparse
import os
import sys
from dotenv import load_dotenv

def create_schema_if_not_exists(engine, schema):
    with engine.connect() as connection:
        connection.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
        connection.commit()

def parse_fixed_columns(column_args):
    """
    Parse arguments like ["col1=val1", "col2=val2"] into a dict
    """
    fixed_columns = {}
    for item in column_args:
        if '=' not in item:
            raise ValueError(f"Invalid format for --add-column: {item}. Expected format is key=value.")
        key, value = item.split('=', 1)
        fixed_columns[key.lower()] = value
    return fixed_columns

def ingest_shapefile(file_path, table_name, db_url, schema="raw", if_exists="replace", fixed_columns=None):
    try:
        print(f"Reading shapefile: {file_path}")
        gdf = gpd.read_file(file_path)
        gdf.columns = [col.lower() for col in gdf.columns]

        # Ajout des colonnes fixes
        if fixed_columns:
            print(f"Adding fixed columns: {fixed_columns}")
            for key, value in fixed_columns.items():
                gdf[key] = value

        engine = create_engine(db_url)
        create_schema_if_not_exists(engine, schema)

        print(f"Ingesting to {schema}.{table_name} with if_exists={if_exists}")
        gdf.to_postgis(table_name, engine, schema=schema, if_exists=if_exists)

        print(f"Successfully ingested {len(gdf)} records to {schema}.{table_name}")
        return True
    except Exception as e:
        print(f"Error ingesting shapefile: {e}", file=sys.stderr)
        return False

def main():
    load_dotenv()

    parser = argparse.ArgumentParser(description='Ingest shapefile to PostgreSQL/PostGIS')
    parser.add_argument('file_path', help='Path to the shapefile (.shp)')
    parser.add_argument('table_name', help='Name for the table in the database')
    parser.add_argument('--schema', default='public_workspace', help='Database schema (default: public_workspace)')
    parser.add_argument('--if-exists', choices=['fail', 'replace', 'append'], default='append', help='Action if table exists (default: append)')
    parser.add_argument('--db-host', default=os.getenv('DB_HOST', 'localhost'), help='Database host')
    parser.add_argument('--db-port', default=os.getenv('DB_PORT', '5433'), help='Database port')
    parser.add_argument('--db-name', default=os.getenv('DB_NAME', 'diagbruit'), help='Database name')
    parser.add_argument('--db-user', default=os.getenv('DB_USER', 'user'), help='Database user')
    parser.add_argument('--db-password', default=os.getenv('DB_PASSWORD', 'password'), help='Database password')

    parser.add_argument('--add-column', action='append', default=[], help='Add a fixed column in the format name=value (can be used multiple times)')

    args = parser.parse_args()
    db_url = f"postgresql://{args.db_user}:{args.db_password}@{args.db_host}:{args.db_port}/{args.db_name}"
    fixed_columns = parse_fixed_columns(args.add_column)

    success = ingest_shapefile(
        args.file_path,
        args.table_name,
        db_url,
        schema=args.schema,
        if_exists=args.if_exists,
        fixed_columns=fixed_columns
    )

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
