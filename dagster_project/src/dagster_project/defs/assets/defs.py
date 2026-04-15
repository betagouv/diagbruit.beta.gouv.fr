import os
import sys
from pathlib import Path

from dagster import AssetExecutionContext, asset

from dagster_project.ingestion.ingest_geojson import ingest_geojson


def _db_url() -> str:
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5433")
    name = os.getenv("DB_NAME", "diagbruit")
    user = os.getenv("DB_USER", "user")
    password = os.getenv("DB_PASSWORD", "password")
    return f"postgresql://{user}:{password}@{host}:{port}/{name}"


DAGSTER_ROOT = Path(__file__).resolve().parents[2]


@asset
def raw_full_osm_data(context: AssetExecutionContext):
    """Ingest OSM food service and school GeoJSON files into public_workspace."""
    files = [
        #replace this line with the path to the osm food service geojson
        (DAGSTER_ROOT / "ingestion" / "inputs" / "osm" / "osm-france-food-service.geojson", "raw_full_osm_foods_data"),
    ]
    db_url = _db_url()
    for file_path, table_name in files:
        context.log.info(f"Ingesting {file_path.name} → {table_name}")
        ingest_geojson(str(file_path), table_name, db_url, schema="public_workspace", if_exists="replace")
