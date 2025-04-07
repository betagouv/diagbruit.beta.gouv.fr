#!/usr/bin/env python
import geopandas as gpd
from sqlalchemy import create_engine, text
import argparse
import os
import sys
from dotenv import load_dotenv


def create_schema_if_not_exists(engine, schema):
    """
    Create schema in PostgreSQL if it doesn't exist

    Args:
        engine: SQLAlchemy engine
        schema (str): Schema name to create
    """
    with engine.connect() as connection:
        connection.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
        connection.commit()
        print(f"Ensured schema {schema} exists")


def ingest_shapefile(file_path, table_name, db_url, schema="raw", if_exists="replace"):
    """
    Ingest a shapefile into PostgreSQL/PostGIS

    Args:
        file_path (str): Path to the shapefile (.shp)
        table_name (str): Name of the table to create in the database
        db_url (str): SQLAlchemy database URL
        schema (str): Database schema to use
        if_exists (str): What to do if table exists ('fail', 'replace', or 'append')

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        print(f"Reading shapefile: {file_path}")
        gdf = gpd.read_file(file_path)

        print(f"Connecting to database")
        engine = create_engine(db_url)

        # Create schema if it doesn't exist
        create_schema_if_not_exists(engine, schema)

        print(f"Ingesting to {schema}.{table_name} with if_exists={if_exists}")
        gdf.to_postgis(table_name, engine, schema=schema, if_exists=if_exists)

        print(f"Successfully ingested {len(gdf)} records to {schema}.{table_name}")
        return True
    except Exception as e:
        print(f"Error ingesting shapefile: {e}", file=sys.stderr)
        return False


def main():
    # Load environment variables from .env file
    load_dotenv()

    # Set up argument parser
    parser = argparse.ArgumentParser(description='Ingest shapefile to PostgreSQL/PostGIS')
    parser.add_argument('file_path', help='Path to the shapefile (.shp)')
    parser.add_argument('table_name', help='Name for the table in the database')
    parser.add_argument('--schema', default='workspace', help='Database schema (default: workspace)')
    parser.add_argument('--if-exists', choices=['fail', 'replace', 'append'],
                        default='replace', help='Action if table exists (default: replace)')
    parser.add_argument('--db-host', default=os.getenv('DB_HOST', 'localhost'),
                        help='Database host')
    parser.add_argument('--db-port', default=os.getenv('DB_PORT', '5433'),
                        help='Database port')
    parser.add_argument('--db-name', default=os.getenv('DB_NAME', 'diagbruit'),
                        help='Database name')
    parser.add_argument('--db-user', default=os.getenv('DB_USER', 'user'),
                        help='Database user')
    parser.add_argument('--db-password', default=os.getenv('DB_PASSWORD', 'password'),
                        help='Database password')

    args = parser.parse_args()

    # Build database URL
    db_url = f"postgresql://{args.db_user}:{args.db_password}@{args.db_host}:{args.db_port}/{args.db_name}"

    # Ingest shapefile
    success = ingest_shapefile(
        args.file_path,
        args.table_name,
        db_url,
        schema=args.schema,
        if_exists=args.if_exists
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()