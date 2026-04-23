import json
import shutil

from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.ingestion.ingest_geojson import ingest_geojson
from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile
from dagster_project.defs.jobs.tools import manifest_file, reporthook, _db_url, download_from_s3, s3, S3_BUCKET, DAGSTER_ROOT

@asset(group_name="strasbourg", key="raw_full_stras_data")
def ingest_strasbourg(context: AssetExecutionContext):
    """Ingest Strasbourg terrasses GeoJSON into public_workspace."""
    file_path = DAGSTER_ROOT / "ingestion" / "inputs" / "strasbourg" / "strasbourg-terrasses-autorisees-2025.geojson"
    context.log.info(f"Ingesting {file_path.name} → raw_full_stras_data")
    row_count = ingest_geojson(str(file_path), "raw_full_stras_data", _db_url(), schema="public_workspace", if_exists="replace")
    return MaterializeResult(metadata={
        "row_count": MetadataValue.int(row_count),
    })

@asset(group_name="launcher", key="noisemap_infra_033_launcher")
def noisemap_infra_033_launcher(context: AssetExecutionContext):
    """Upload noisemap infras from dept 033 files to S3 bucket."""

    #to be replaced with origin url
    input_dir = DAGSTER_ROOT / "ingestion" / "inputs" / "noise" / "INFRA_FASTLINES_033" / "type_a_lden"

    s3_path = "noisemap/cbs_infra/dept=033/campaign=2026/type_a_lden/"
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

    context.log.info(f"Uploaded {uploaded} files to s3://{S3_BUCKET}/{s3_path}_source")
    return MaterializeResult(metadata={
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(s3_path),
        "files_uploaded": MetadataValue.int(uploaded),
        "manifest": MetadataValue.json(manifest),
    })

@asset(group_name="launcher", key="peb_launcher")
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
        

@asset(group_name="landing", key="raw_peb", deps=["peb_launcher"])
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

    row_count = ingest_shapefile(str(shp_file), "raw_peb", _db_url(), schema="public_workspace", if_exists="replace")
    context.log.info(f"Ingestion Successful for {file_path}")

    shutil.rmtree(file_path)
    context.log.info(f"Deleted {file_path}")

    return MaterializeResult(metadata={
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(s3_path),
        "files_downloaded": MetadataValue.int(downloaded),
        "row_count": MetadataValue.int(row_count)
    })

