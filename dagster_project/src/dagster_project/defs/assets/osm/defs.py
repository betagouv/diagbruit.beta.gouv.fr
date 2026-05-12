import io
import json
import shutil
import urllib.request
import zipfile
import time

from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.ingestion.ingest_geojson import ingest_geojson
from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile
from dagster_project.io import DAGSTER_ROOT
from dagster_project.io.db import db_url
from dagster_project.io.manifest import manifest_file, reporthook
from dagster_project.io.s3 import S3_BUCKET, download_from_s3, s3

GROUP = "osm"
SOURCE = "data.gouv"

OSM_FOODS_URL = "https://data.smartidf.services/api/explore/v2.1/catalog/datasets/osm-france-food-service/exports/geojson?lang=fr&timezone=Europe%2FParis"

@asset(
    key="osm_foods_launcher",
    group_name=GROUP,
    tags={"stage": "launcher", "source": SOURCE},
    kinds={"s3"},
)
def osm_foods_launcher(context: AssetExecutionContext):
    """Download and uploading OSM schools service SHP into S3."""
    file_path = DAGSTER_ROOT / "ingestion" / "inputs" / "osm" / "foods" / "osm-france-food-service.geojson"
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

    context.log.info(f"Uploading OSM foods data to S3")

    s3_path = "noisesource/osm/foods/"
    manifest_key = s3_path + "manifest.json"

    manifest = manifest_file(file_path)

    s3.put_object(
        Bucket=S3_BUCKET,
        Key=manifest_key,
        Body=json.dumps(manifest, indent=2),
        ContentType="application/json",
    )

    context.log.info(f"Uploaded manifest → s3://{S3_BUCKET}/{manifest_key}")

    s3.upload_file(str(file_path), S3_BUCKET, f"{s3_path}_source/{file_path.name}")

    context.log.info(f"Uploaded {file_path} files to s3://{S3_BUCKET}/{s3_path}_source")

    return MaterializeResult(metadata={
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(s3_path),
        "source_url": MetadataValue.url(OSM_FOODS_URL),
        "file_size_mb": MetadataValue.float(round(file_size_mb, 2)),
    })

OSM_SCHOOLS_URL = "https://www.data.gouv.fr/api/1/datasets/r/bedd394a-24c6-40e1-b0a9-303f78e119c5"

@asset(
    key="osm_schools_launcher",
    group_name=GROUP,
    tags={"stage": "launcher", "source": SOURCE},
    kinds={"s3"},
)
def osm_schools_launcher(context: AssetExecutionContext):
    """Download OSM schools ZIP, extract, and upload SHP files to S3."""
    file_path = DAGSTER_ROOT / "ingestion" / "inputs" / "osm" / "schools"
    file_path.mkdir(parents=True, exist_ok=True)

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

    zip_buffer.seek(0)
    with zipfile.ZipFile(zip_buffer) as zf:
        zf.extractall(file_path)
        extracted = zf.namelist()
    context.log.info(f"Extracted {len(extracted)} files: {extracted}")

    s3_path = "noisesource/osm/schools/"
    manifest_key = s3_path + "manifest.json"

    manifest = manifest_file(file_path)
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=manifest_key,
        Body=json.dumps(manifest, indent=2),
        ContentType="application/json",
    )
    context.log.info(f"Uploaded manifest → s3://{S3_BUCKET}/{manifest_key}")

    uploaded = 0
    for file in file_path.rglob("*"):
        if not file.is_file():
            continue
        key = f"{s3_path}_source/{file.relative_to(file_path)}"
        context.log.info(f"Uploading {file.name} → s3://{S3_BUCKET}/{key}")
        s3.upload_file(str(file), S3_BUCKET, key)
        uploaded += 1

    shutil.rmtree(file_path)
    context.log.info(f"Uploaded {uploaded} files to s3://{S3_BUCKET}/{s3_path}_source")

    return MaterializeResult(metadata={
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(s3_path),
        "source_url": MetadataValue.url(OSM_SCHOOLS_URL),
        "zip_size_mb": MetadataValue.float(round(zip_size_mb, 2)),
        "files_uploaded": MetadataValue.int(uploaded),
    })


@asset(
    key="raw_full_osm_schools_data",
    group_name=GROUP,
    tags={"stage": "landing", "source": SOURCE},
    kinds={"s3", "postgres"},
    deps=["osm_schools_launcher"],
)
def osm_schools_landing(context: AssetExecutionContext):
    """Download OSM schools SHP files from S3 and ingest into public_workspace."""
    s3_path = "noisesource/osm/schools/_source/"

    file_path = DAGSTER_ROOT / "ingestion" / "inputs" / "osm" / "schools"
    file_path.mkdir(parents=True, exist_ok=True)

    downloaded = download_from_s3(bucket=S3_BUCKET, file_path=file_path, s3_path=s3_path, context=context)

    if downloaded == 0:
        context.log.info(f"No files found at s3://{S3_BUCKET}/{s3_path}")
        return MaterializeResult(metadata={
            "bucket": MetadataValue.text(S3_BUCKET),
            "files_downloaded": MetadataValue.int(0),
        })

    context.log.info(f"Downloaded {downloaded} files from s3://{S3_BUCKET}/{s3_path}")

    shp_files = list(file_path.rglob("*.shp"))
    if not shp_files:
        raise FileNotFoundError(f"No .shp file found in {file_path}")
    shp_file = shp_files[0]
    context.log.info(f"Ingesting {shp_file.name} → raw_full_osm_schools_data")

    row_count = ingest_shapefile(str(shp_file), "raw_full_osm_schools_data", db_url(), schema="public_workspace", if_exists="replace")

    shutil.rmtree(file_path)
    context.log.info(f"Deleted {file_path}")

    return MaterializeResult(metadata={
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(s3_path),
        "files_downloaded": MetadataValue.int(downloaded),
        "row_count": MetadataValue.int(row_count),
    })

@asset(
    key="raw_full_osm_foods_data",
    group_name=GROUP,
    tags={"stage": "landing", "source": SOURCE},
    kinds={"s3", "postgres"},
    deps=["osm_foods_launcher"],
)
def osm_foods_landing(context: AssetExecutionContext):
    """Download osm foods source files from S3 and ingest into public_workspace."""
    s3_path = "noisesource/osm/foods/_source/"

    file_path = DAGSTER_ROOT / "ingestion" / "inputs" / "osm" / "foods"
    file_path.mkdir(parents=True, exist_ok=True)

    downloaded = download_from_s3(bucket=S3_BUCKET, file_path=file_path, s3_path=s3_path, context=context)

    if downloaded == 0:
        context.log.info(f"No files found at s3://{S3_BUCKET}/{s3_path}")
        return MaterializeResult(metadata={
            "bucket": MetadataValue.text(S3_BUCKET),
            "files_downloaded": MetadataValue.int(0),
        })

    context.log.info(f"Downloaded {downloaded} files from s3://{S3_BUCKET}/{s3_path}")

    geojson_files = list(file_path.rglob("*.geojson"))
    if not geojson_files:
        raise FileNotFoundError(f"No .geojson file found in {file_path}")
    geojson_file = geojson_files[0]
    context.log.info(f"Ingesting {geojson_file.name} → raw_full_osm_foods_data")

    row_count = ingest_geojson(str(geojson_file), "raw_full_osm_foods_data", db_url(), schema="public_workspace", if_exists="replace")

    shutil.rmtree(file_path.parent)
    context.log.info(f"Deleted {file_path.parent}")

    return MaterializeResult(metadata={
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(s3_path),
        "files_downloaded": MetadataValue.int(downloaded),
        "row_count": MetadataValue.int(row_count),
    })