from pathlib import Path
from datetime import datetime, timezone
from typing import Callable
import hashlib
import io
import json
import shutil
import time
import urllib.request
import zipfile

from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile
from dagster_project.defs.jobs.tools import reporthook, _db_url, download_from_s3, s3, S3_BUCKET, DAGSTER_ROOT

DEPT033_URL = [
    "https://www.data.gouv.fr/api/1/datasets/r/17e3754b-b23a-4c5d-be5c-becb000a9d4c",
    "https://www.data.gouv.fr/api/1/datasets/r/7bc3ddc2-cded-4b4e-bdc5-0c270ecb6201",
    "https://www.data.gouv.fr/api/1/datasets/r/00872b29-5e87-4d24-ba33-28c0faa808a1",
    "https://www.data.gouv.fr/api/1/datasets/r/b5033591-4cbc-4160-87d7-fae72776ac62",
    "https://www.data.gouv.fr/api/1/datasets/r/58ea856f-99e7-4a49-b20d-432076a430c7",
    "https://www.data.gouv.fr/api/1/datasets/r/3bcd60ce-0a1d-4500-bf73-73e20d65af9b",
    "https://www.data.gouv.fr/api/1/datasets/r/c680c193-25ac-46ed-907c-05962f260088",
    "https://www.data.gouv.fr/api/1/datasets/r/18e1bb2e-c5ea-4e09-abd7-f07adb3ced94",
    "https://www.data.gouv.fr/api/1/datasets/r/0598a10c-89f0-4eae-8b8f-7ecda5e770be",
    "https://www.data.gouv.fr/api/1/datasets/r/ad82bc06-5f23-4ca0-935f-8f16feba630b",
    "https://www.data.gouv.fr/api/1/datasets/r/d7546128-fb23-4cbd-a43a-42d0e2890286",
    "https://www.data.gouv.fr/api/1/datasets/r/5cb02473-5c7a-416a-a883-c22fce652819"
]

DEPT044_URL = [
    "https://www.data.gouv.fr/api/1/datasets/r/e9b82009-955b-4997-bf1d-f6a542eadda3"
]

def download_extract_upload(url: str, extract_dir: Path, source_prefix: str, context: AssetExecutionContext) -> tuple[list[str], dict[str, str]]:
    """Download a ZIP from url, extract it to extract_dir, upload all files to S3 under source_prefix.
    Returns (shp_paths, sha256) where sha256 maps relative path → hash, computed before cleanup."""
    start_time = time.time()
    last_log_time = [start_time]

    zip_buffer = io.BytesIO()
    with urllib.request.urlopen(url) as response:
        while chunk := response.read(8192):
            zip_buffer.write(chunk)
            block_count = zip_buffer.tell() // 8192
            reporthook(block_count, 8192, -1, context, start_time, last_log_time)

    zip_size_mb = zip_buffer.tell() / 1024 / 1024
    context.log.info(f"Downloaded {zip_size_mb:.1f} MB in {time.time() - start_time:.1f}s")

    extract_dir.mkdir(parents=True, exist_ok=True)
    zip_buffer.seek(0)
    with zipfile.ZipFile(zip_buffer) as zf:
        zf.extractall(extract_dir)
        extracted = zf.namelist()
    context.log.info(f"Extracted {len(extracted)} files")

    shp_paths = []
    sha256 = {}
    for file in extract_dir.rglob("*"):
        if not file.is_file():
            continue
        relative = file.relative_to(extract_dir)
        sha256[str(relative)] = hashlib.sha256(file.read_bytes()).hexdigest()
        key = f"{source_prefix}{relative}"
        s3.upload_file(str(file), S3_BUCKET, key)
        if file.suffix == ".shp":
            shp_paths.append(str(relative))

    shutil.rmtree(extract_dir)
    context.log.info(f"Uploaded {len(shp_paths)} shp files to s3://{S3_BUCKET}/{source_prefix}")
    return shp_paths, sha256


def rename_infra(file:str) -> dict:
    return {
        "name": file,
        "mapping": {
            "geometry": True,
            "codeinfra": {"from": "codinfra"},
            "id": {"from": "idzonbruit"},
            "idcbs" : True,
            "annee" : True,
            "uueid" : True,
            "codedept" : True,
            "typeterr" : True,
            "producteur" : True,
            "typesource" : True,
            "cbstype" : True,
            "zonedef" : True,
            "legende" : True,
            "indicetype" : True,
            "validedeb" : True,
            "validefin" : True,
        },
    }

def s3_launcher(context: AssetExecutionContext, path: str, arr_url: list[str], callback: Callable[..., dict] = rename_infra):
    source_prefix = path + "_source/"
    mapping_key = path + "mapping.json"

    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / path
    local_dir.mkdir(parents=True, exist_ok=True)

    mapping_infra = []
    all_sha256 = {}

    for i, url in enumerate(arr_url):
        context.log.info(f"[{i + 1}/{len(arr_url)}] Downloading {url}")
        shp_paths, sha256 = download_extract_upload(url, local_dir / f"zip_{i}", source_prefix, context)
        mapping_infra.extend(callback(p) for p in shp_paths)
        all_sha256.update(sha256)

    manifest_key = path + "manifest.json"
    manifest = {
        "provenance": arr_url,
        "pulled_at": datetime.now(timezone.utc).isoformat(),
        "sha256": all_sha256,
    }

    s3.put_object(
        Bucket=S3_BUCKET,
        Key=manifest_key,
        Body=json.dumps(manifest, indent=2),
        ContentType="application/json",
    )

    context.log.info(f"Uploaded manifest → s3://{S3_BUCKET}/{manifest_key}")

    s3.put_object(
        Bucket=S3_BUCKET,
        Key=mapping_key,
        Body=json.dumps(mapping_infra, indent=2),
        ContentType="application/json",
    )
    context.log.info(f"Uploaded mapping → s3://{S3_BUCKET}/{mapping_key}")

    return MaterializeResult(metadata={
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(path),
        "mapping": MetadataValue.json(mapping_infra),
        "manifest": MetadataValue.json(manifest),
    })

def s3_landing(context: AssetExecutionContext,path:str, if_exist:str = "append",  db_name:str = "raw_noisemap"):
    source_s3_path = path + "_source/"
    mapping_s3_key = path + "mapping.json"

    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / path
    local_dir.mkdir(parents=True, exist_ok=True)

    mapping_obj = s3.get_object(Bucket=S3_BUCKET, Key=mapping_s3_key)
    mapping = json.loads(mapping_obj["Body"].read())
    context.log.info(f"Loaded mapping: {len(mapping)} entries from s3://{S3_BUCKET}/{mapping_s3_key}")

    downloaded = download_from_s3(bucket=S3_BUCKET, file_path=local_dir, s3_path=source_s3_path, context=context)

    if downloaded == 0:
        context.log.warning(f"No source files found at s3://{S3_BUCKET}/{source_s3_path}")
        shutil.rmtree(local_dir)
        return MaterializeResult(metadata={
            "files_downloaded": MetadataValue.int(0),
            "files_ingested": MetadataValue.int(0),
        })

    ingested = 0
    skipped = 0

    for entry in mapping:
        shp_path = local_dir / entry["name"]
        if not shp_path.exists():
            context.log.warning(f"File not found, skipping: {entry['name']}")
            skipped += 1
            continue
        
        context.log.info(f"Ingesting {entry['name']} → {db_name}")
        success = ingest_shapefile(
            str(shp_path),
            db_name,
            _db_url(),
            schema="public_workspace",
            if_exists=if_exist,
            mapping=entry.get("mapping"),
        )
        if success:
            ingested += 1
        else:
            context.log.error(f"Failed to ingest {entry['name']}")

    shutil.rmtree(local_dir.parent.parent)
    context.log.info(f"Cleaned up {local_dir.parent.parent}")

    return MaterializeResult(metadata={
        "files_downloaded": MetadataValue.int(downloaded),
        "files_ingested": MetadataValue.int(ingested),
        "files_skipped": MetadataValue.int(skipped),
    })

@asset(group_name="launcher", key="infra_033_launcher")
def infra_033_launcher(context: AssetExecutionContext):
    """Download infra 033 ZIPs from data.gouv.fr, extract, upload to S3, and write mapping."""
    path = "noisemap/cbs_infra/dept=033/campaign=2022/"
    return(s3_launcher(context=context,path=path, arr_url=DEPT033_URL))

@asset(group_name="launcher", key="infra_044_launcher")
def infra_044_launcher(context: AssetExecutionContext):
    """Download infra 044 ZIPs from data.gouv.fr, extract, upload to S3, and write mapping."""
    path = "noisemap/cbs_infra/dept=044/campaign=2022/"
    return(s3_launcher(context=context,path=path, arr_url=DEPT044_URL))

@asset(group_name="landing", key="infra_033_landing", deps=["infra_033_launcher"])
def infra_033_landing(context: AssetExecutionContext):
    """Download infra 033 files from S3 and ingest into public_workspace.raw_noisemap."""
    path = "noisemap/cbs_infra/dept=033/campaign=2022/"
    return(s3_landing(context=context, path=path))

@asset(group_name="landing", key="infra_044_landing", deps=["infra_044_launcher"])
def infra_044_landing(context: AssetExecutionContext):
    """Download infra 044 ZIPs from S3 and ingest into public_workspace.raw_noisemap."""
    path = "noisemap/cbs_infra/dept=044/campaign=2022/"
    return(s3_landing(context=context, path=path))