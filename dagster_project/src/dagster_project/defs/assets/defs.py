import io
import os
import shutil
import time
import urllib.request
import zipfile
from pathlib import Path

from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.ingestion.ingest_geojson import ingest_geojson
from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile


def _db_url() -> str:
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5433")
    name = os.getenv("DB_NAME", "diagbruit")
    user = os.getenv("DB_USER", "user")
    password = os.getenv("DB_PASSWORD", "password")
    return f"postgresql://{user}:{password}@{host}:{port}/{name}"


def reporthook(block_count: int, block_size: int, total_size: int, context: AssetExecutionContext, start_time: float, last_log_time: list) -> None:
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

@asset(group_name="strasbourg", key="raw_full_stras_data")
def ingest_strasbourg(context: AssetExecutionContext):
    """Ingest Strasbourg terrasses GeoJSON into public_workspace."""
    file_path = DAGSTER_ROOT / "ingestion" / "inputs" / "strasbourg" / "strasbourg-terrasses-autorisees-2025.geojson"
    context.log.info(f"Ingesting {file_path.name} → raw_full_stras_data")
    row_count = ingest_geojson(str(file_path), "raw_full_stras_data", _db_url(), schema="public_workspace", if_exists="replace")
    return MaterializeResult(metadata={
        "row_count": MetadataValue.int(row_count),
    })


OSM_FOODS_URL = "https://data.smartidf.services/api/explore/v2.1/catalog/datasets/osm-france-food-service/exports/geojson?lang=fr&timezone=Europe%2FParis"

@asset(group_name="osm", key="raw_full_osm_foods_data")
def ingest_osm_foods(context: AssetExecutionContext):
    """Download and ingest OSM food service GeoJSON into public_workspace."""
    file_path = DAGSTER_ROOT / "ingestion" / "inputs" / "osm" / "osm-france-food-service.geojson"
    file_path.parent.mkdir(parents=True, exist_ok=True)

    context.log.info(f"Downloading OSM foods data from {OSM_FOODS_URL}")
    start_time = time.time()
    last_log_time = [start_time]
    urllib.request.urlretrieve(
        OSM_FOODS_URL,
        file_path,
        reporthook=lambda b, bs, ts: reporthook(b, bs, ts, context, start_time, last_log_time),
    )
    file_size_mb = file_path.stat().st_size / 1024 / 1024
    context.log.info(f"Downloaded {file_size_mb:.1f} MB in {time.time() - start_time:.1f}s")

    context.log.info("Ingesting → raw_full_osm_foods_data")
    row_count = ingest_geojson(str(file_path), "raw_full_osm_foods_data", _db_url(), schema="public_workspace", if_exists="replace")

    file_path.unlink()
    context.log.info(f"Deleted {file_path}")

    return MaterializeResult(metadata={
        "source_url": MetadataValue.url(OSM_FOODS_URL),
        "file_size_mb": MetadataValue.float(round(file_size_mb, 2)),
        "row_count": MetadataValue.int(row_count),
    })


OSM_SCHOOLS_URL = "https://www.data.gouv.fr/api/1/datasets/r/bedd394a-24c6-40e1-b0a9-303f78e119c5"

@asset(group_name="osm", key="raw_full_osm_schools_data")
def ingest_osm_schools(context:AssetExecutionContext):
    """Download and ingest OSM schools service SHP into public_workspace."""
    file_path = DAGSTER_ROOT / "ingestion" / "inputs" / "osm" / "schools"
    file_path.parent.mkdir(parents=True, exist_ok=True)

    context.log.info(f"Downloading OSM schools data from {OSM_SCHOOLS_URL}")
    start_time = time.time()
    last_log_time = [start_time]

    zip_buffer = io.BytesIO()
    with urllib.request.urlopen(OSM_SCHOOLS_URL) as response:
        while chunk := response.read(8192):
            zip_buffer.write(chunk)
            block_count = zip_buffer.tell() // 8192
            reporthook(block_count, 8192, -1, context, start_time, last_log_time)

    zip_size_mb = zip_buffer.tell() / 1024 / 1024
    context.log.info(f"Downloaded {zip_size_mb:.1f} MB in {time.time() - start_time:.1f}s")

    context.log.info(f"Extracting zip to {file_path}")
    file_path.mkdir(parents=True, exist_ok=True)
    zip_buffer.seek(0)
    with zipfile.ZipFile(zip_buffer) as zf:
        zf.extractall(file_path)
        extracted = zf.namelist()
    context.log.info(f"Extracted {len(extracted)} files: {extracted}")

    shp_files = list(file_path.rglob("*.shp"))
    if not shp_files:
        raise FileNotFoundError(f"No .shp file found in extracted zip at {file_path}")
    shp_file = shp_files[0]
    context.log.info(f"Ingesting {shp_file.name} → raw_full_osm_schools_data")

    row_count = ingest_shapefile(str(shp_file), "raw_full_osm_schools_data", _db_url(), schema="public_workspace", if_exists="replace")

    shutil.rmtree(file_path)
    context.log.info(f"Deleted {file_path}")

    return MaterializeResult(metadata={
        "source_url": MetadataValue.url(OSM_SCHOOLS_URL),
        "zip_size_mb": MetadataValue.float(round(zip_size_mb, 2)),
        "extracted_files": MetadataValue.json(extracted),
        "row_count": MetadataValue.int(row_count),

    })

@asset(group_name="peb", key="raw_peb")
def raw_peb(context:AssetExecutionContext) :
    """Ingest PEB SHP into public_workspace."""
    file_path = DAGSTER_ROOT / "ingestion" / "inputs" / "PEB"
    file_path.parent.mkdir(parents=True, exist_ok=True)

    shp_files = list(file_path.rglob("*.shp"))
    shp_file = shp_files[0]
    context.log.info(f"Ingesting {shp_file.name} → raw_peb")

    row_count = ingest_shapefile(str(shp_file), "raw_peb", _db_url(), schema="public_workspace", if_exists="replace")
    context.log.info(f"Ingestion Successful for {file_path}")

    return MaterializeResult(metadata={
        "row_count": MetadataValue.int(row_count)
    })