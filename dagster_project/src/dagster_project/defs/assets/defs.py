import os
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


@asset(group_name="ingestion", key="raw_full_stras_data")
def ingest_strasbourg(context: AssetExecutionContext):
    """Ingest Strasbourg terrasses GeoJSON into public_workspace."""
    file_path = DAGSTER_ROOT / "ingestion" / "inputs" / "strasbourg" / "strasbourg-terrasses-autorisees-2025.geojson"
    context.log.info(f"Ingesting {file_path.name} → raw_full_stras_data")
    ingest_geojson(str(file_path), "raw_full_stras_data", _db_url(), schema="public_workspace", if_exists="replace")


@asset(group_name="ingestion", key="raw_full_osm_foods_data")
def ingest_osm_foods(context: AssetExecutionContext):
    """Ingest OSM food service GeoJSON into public_workspace."""
    file_path = DAGSTER_ROOT / "ingestion" / "inputs" / "osm" / "osm-france-food-service.geojson"
    context.log.info(f"Ingesting {file_path.name} → raw_full_osm_foods_data")
    ingest_geojson(str(file_path), "raw_full_osm_foods_data", _db_url(), schema="public_workspace", if_exists="replace")