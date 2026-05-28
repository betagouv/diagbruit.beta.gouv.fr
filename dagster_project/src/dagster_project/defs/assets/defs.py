import json
import shutil

from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.defs.resources.box import BoxResource
from dagster_project.ingestion.ingest_geojson import ingest_geojson
from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile
from dagster_project.io import DAGSTER_ROOT
from dagster_project.io.db import db_url
from dagster_project.io.manifest import manifest_file
from dagster_project.io.s3 import S3_BUCKET, download_from_s3, s3

BOX_FILE_ID_TERRASSES_067 = "2250761602923"

@asset(
    key="raw_full_osm_terrasses",
    group_name="osm",
    tags={"source": "box"},
    kinds={"box", "postgres"},
)
def ingest_strasbourg(context: AssetExecutionContext, box: BoxResource):
    """Download Strasbourg terrasses GeoJSON from Box and ingest into public_workspace."""
    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / "strasbourg"
    local_dir.mkdir(parents=True, exist_ok=True)

    try:
        client = box.get_client()
        context.log.info(f"Downloading file {BOX_FILE_ID_TERRASSES_067} from Box")
        stream = client.downloads.download_file(BOX_FILE_ID_TERRASSES_067)
        content = stream.read()
        file_path = local_dir / "strasbourg-terrasses.geojson"
        file_path.write_bytes(content)
        context.log.info(f"Downloaded {len(content)} bytes → {file_path.name}")

        row_count = ingest_geojson(str(file_path), "raw_full_osm_terrasses", db_url(), schema="public_workspace", if_exists="replace", extra_columns={"codedept": "067"})
        context.log.info(f"Ingested {row_count} rows → raw_full_osm_terrasses")
    finally:
        shutil.rmtree(local_dir, ignore_errors=True)

    return MaterializeResult(metadata={
        "box_file_id": MetadataValue.text(BOX_FILE_ID_TERRASSES_067),
        "row_count": MetadataValue.int(row_count),
    })


@asset(
    key="peb_launcher",
    group_name="peb",
    tags={"stage": "launcher", "source": "local"},
    kinds={"s3"},
)
def peb_launcher(context: AssetExecutionContext):
    """Upload PEB SHP into S3."""

    #to be replaced with origin url
    input_dir = DAGSTER_ROOT / "ingestion" / "inputs" / "PEB"

    s3_path = "peb/scope=national/campaign=2023/"
    manifest_key = s3_path + "manifest.json"

    manifest = manifest_file(input_dir)

    s3.put_object(
        Bucket=S3_BUCKET,
        Key=manifest_key,
        Body=json.dumps(manifest, indent=2),
        ContentType="application/json",
    )
    context.log.info(f"Uploaded manifest → s3://{S3_BUCKET}/{manifest_key}")

    files = list(input_dir.rglob("*"))

    uploaded = 0
    for file in files:
        if not file.is_file():
            continue
        key = f"{s3_path}_source/{file.relative_to(input_dir)}"
        context.log.info(f"Uploading {file.name} → s3://{S3_BUCKET}/{key}")
        s3.upload_file(str(file), S3_BUCKET, key)
        uploaded += 1

    return MaterializeResult(metadata={
            "bucket": MetadataValue.text(S3_BUCKET),
            "prefix": MetadataValue.text(s3_path),
            "files_uploaded": MetadataValue.int(uploaded),
            "manifest": MetadataValue.json(manifest_file(input_dir)),
        })
        

@asset(
    key="raw_peb",
    group_name="peb",
    tags={"stage": "landing", "source": "local"},
    kinds={"s3", "postgres"},
    deps=["peb_launcher"],
)
def peb_landing(context: AssetExecutionContext):
    """Download all PEB source files from S3 and ingest into public_workspace."""
    s3_path = "peb/scope=national/campaign=2023/_source/"

    file_path = DAGSTER_ROOT / "ingestion" / "inputs" / "peb"
    file_path.parent.mkdir(parents=True, exist_ok=True)

    downloaded = download_from_s3(bucket=S3_BUCKET, file_path=file_path, s3_path=s3_path, context=context)

    if downloaded == 0:
        context.log.info(f"No files found at s3://{S3_BUCKET}/{s3_path}")
        return MaterializeResult(metadata={
            "bucket": MetadataValue.text(S3_BUCKET),
            "files_downloaded": MetadataValue.int(0),
        })

    shp_files = list(file_path.rglob("*.shp"))
    shp_file = shp_files[0]
    context.log.info(f"Ingesting {shp_file.name} → raw_peb")

    row_count = ingest_shapefile(str(shp_file), "raw_peb", db_url(), schema="public_workspace", if_exists="replace")
    context.log.info(f"Ingestion Successful for {file_path}")

    shutil.rmtree(file_path)
    context.log.info(f"Deleted {file_path}")

    return MaterializeResult(metadata={
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(s3_path),
        "files_downloaded": MetadataValue.int(downloaded),
        "row_count": MetadataValue.int(row_count)
    })

