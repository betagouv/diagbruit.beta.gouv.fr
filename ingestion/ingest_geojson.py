import geopandas as gpd
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv
import argparse
import os
import sys

def ingest_geojson(file_path, table_name, db_url, schema, if_exists):
    try:
        TABLE_NAME = table_name

        engine = create_engine(db_url)

        geojson = gpd.read_file(file_path)

        if if_exists == 'skip':
            inspector = inspect(engine)
            full_table_name = f"{schema}.{table_name}"
            tables = inspector.get_table_names(schema=schema)
            if table_name in tables:
                print(f"ℹ️ Table {full_table_name} already exists — skipping ingestion.")
                return True
            if_exists = 'replace'

        print(geojson.crs)

        if geojson.crs is None:
            geojson.set_crs(epsg=4326, inplace=True)

        geojson.to_postgis(
            TABLE_NAME,
            engine,
            if_exists=if_exists,
            schema=schema,
            index=False
        )

        return True

        print("Data imported successfully")
    except Exception as e:
        print(f"Error importing geojson data : {e}", file=sys.stderr)
        return False

def main():
    load_dotenv()

    parser = argparse.ArgumentParser(description='Ingest shapefile to PostgreSQL/PostGIS')
    parser.add_argument('file_path', help='Path to the geojson file (.shp)')
    parser.add_argument('table_name', help='Name for the table in the database')
    parser.add_argument('--schema', default='public_workspace', help='Database schema (default: public_workspace)')
    parser.add_argument('--if-exists', choices=['fail', 'replace', 'append', 'skip'], default='append', help='Action if table exists (default: append)')
    parser.add_argument('--db-host', default=os.getenv('DB_HOST', 'localhost'), help='Database host')
    parser.add_argument('--db-port', default=os.getenv('DB_PORT', '5433'), help='Database port')
    parser.add_argument('--db-name', default=os.getenv('DB_NAME', 'diagbruit'), help='Database name')
    parser.add_argument('--db-user', default=os.getenv('DB_USER', 'user'), help='Database user')
    parser.add_argument('--db-password', default=os.getenv('DB_PASSWORD', 'password'), help='Database password')

    args = parser.parse_args()
    db_url = f"postgresql://{args.db_user}:{args.db_password}@{args.db_host}:{args.db_port}/{args.db_name}"

    success = ingest_geojson(
        args.file_path,
        args.table_name,
        db_url,
        schema=args.schema,
        if_exists=args.if_exists,
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()