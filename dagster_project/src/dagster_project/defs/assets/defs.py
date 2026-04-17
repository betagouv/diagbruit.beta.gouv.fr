import os
import time
import urllib.request
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


start_time = time.time()
last_log_time = [start_time]

def reporthook(block_count: int, block_size: int, total_size: int, context: AssetExecutionContext) -> None:
    now = time.time()
    if now - last_log_time[0] < 2:
        return
    last_log_time[0] = now

    downloaded = block_count * block_size
    elapsed = now - start_time
    speed_mb = (downloaded / elapsed) / (1024 * 1024) if elapsed > 0 else 0

    if total_size > 0:
        percent = min(downloaded / total_size * 100, 100)
        context.log.info(f"Downloading... {percent:.1f}% — {speed_mb:.2f} MB/s")
    else:
        context.log.info(f"Downloading... {downloaded / (1024 * 1024):.1f} MB — {speed_mb:.2f} MB/s")

DAGSTER_ROOT = Path(__file__).resolve().parents[2]


@asset(group_name="ingestion", key="raw_full_stras_data")
def ingest_strasbourg(context: AssetExecutionContext):
    """Ingest Strasbourg terrasses GeoJSON into public_workspace."""
    file_path = DAGSTER_ROOT / "ingestion" / "inputs" / "strasbourg" / "strasbourg-terrasses-autorisees-2025.geojson"
    context.log.info(f"Ingesting {file_path.name} → raw_full_stras_data")
    ingest_geojson(str(file_path), "raw_full_stras_data", _db_url(), schema="public_workspace", if_exists="replace")


OSM_FOODS_URL = "https://data.smartidf.services/api/explore/v2.1/catalog/datasets/osm-france-food-service/exports/geojson?lang=fr&timezone=Europe%2FParis"


@asset(group_name="ingestion", key="raw_full_osm_foods_data")
def ingest_osm_foods(context: AssetExecutionContext):
    """Download and ingest OSM food service GeoJSON into public_workspace."""
    file_path = DAGSTER_ROOT / "ingestion" / "inputs" / "osm" / "osm-france-food-service.geojson"
    file_path.parent.mkdir(parents=True, exist_ok=True)

    context.log.info(f"Downloading OSM foods data from {OSM_FOODS_URL}")

    urllib.request.urlretrieve(OSM_FOODS_URL, file_path, reporthook=lambda b, bs, ts: reporthook(b, bs, ts, context))
    context.log.info(f"Downloaded to {file_path} ({file_path.stat().st_size / 1024 / 1024:.1f} MB)")

    context.log.info("Ingesting → raw_full_osm_foods_data")
    ingest_geojson(str(file_path), "raw_full_osm_foods_data", _db_url(), schema="public_workspace", if_exists="replace")

    file_path.unlink()
    context.log.info(f"Deleted {file_path}")