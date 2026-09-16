import os
import shutil
import time
import urllib.request
import zipfile
from pathlib import Path

import boto3

from dagster import AssetExecutionContext

from dagster_project.io.manifest import reporthook, sha256_file

S3_BUCKET: str = os.getenv("AWS_S3_BUCKET", "diagbruit-dagster")

s3 = boto3.client(
    "s3",
    region_name=os.getenv("AWS_DEFAULT_REGION", "eu-west-3"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)


def download_from_s3(bucket: str, file_path: Path, s3_path: str, context: AssetExecutionContext) -> int:
    """Download every object under `s3_path` from `bucket` into `file_path`. Returns the count."""
    downloaded = 0

    paginator = s3.get_paginator("list_objects_v2")
    pages = paginator.paginate(Bucket=bucket, Prefix=s3_path)

    for page in pages:
        for obj in page.get("Contents", []):
            key = obj["Key"]
            relative = key[len(s3_path):]
            if not relative:
                continue
            local_path = file_path / relative
            local_path.parent.mkdir(parents=True, exist_ok=True)
            context.log.info(f"Downloading s3://{bucket}/{key} → {local_path.name}")
            s3.download_file(bucket, key, str(local_path))
            downloaded += 1
    return downloaded


def download_upload(url: str, local_dir: Path, source_prefix: str, context: AssetExecutionContext) -> tuple[str, str]:
    """Download a single (non-archive) file from `url` into `local_dir`, upload to S3 under `source_prefix`.

    Counterpart to `download_extract_upload` for plain files (e.g. GeoJSON) where
    there is nothing to unzip. Returns (filename, sha256), sha256 computed before
    any cleanup so the caller can build a manifest.
    """
    filename = url.split("/")[-1].split("?")[0]
    local_dir.mkdir(parents=True, exist_ok=True)
    local_path = local_dir / filename

    start_time = time.time()
    last_log_time = [start_time]

    with urllib.request.urlopen(url) as response, open(local_path, "wb") as out:
        while chunk := response.read(8192):
            out.write(chunk)
            block_count = local_path.stat().st_size // 8192
            reporthook(block_count, 8192, -1, context, start_time, last_log_time)

    size_mb = local_path.stat().st_size / 1024 / 1024
    context.log.info(f"Downloaded {filename} ({size_mb:.1f} MB) in {time.time() - start_time:.1f}s")

    sha256 = sha256_file(local_path)
    key = f"{source_prefix}{filename}"
    s3.upload_file(str(local_path), S3_BUCKET, key)
    context.log.info(f"Uploaded {filename} → s3://{S3_BUCKET}/{key}")
    return filename, sha256


def download_extract_upload(url: str, extract_dir: Path, source_prefix: str, context: AssetExecutionContext) -> tuple[list[str], dict[str, str]]:
    """Download a ZIP from url, extract to extract_dir, upload every file to S3 under source_prefix.

    Everything streams through disk rather than memory: a cadastre department ZIP is
    ~350 MB and expands to ~630 MB, which a buffered download plus `read_bytes()`
    hashing would hold in RAM all at once.

    Returns (shp_paths, sha256) where sha256 maps relative path → hash, computed before cleanup.
    """
    start_time = time.time()
    last_log_time = [start_time]

    extract_dir.mkdir(parents=True, exist_ok=True)
    zip_path = extract_dir / "_download.zip"

    with urllib.request.urlopen(url) as response, open(zip_path, "wb") as out:
        downloaded = 0
        while chunk := response.read(1024 * 1024):
            out.write(chunk)
            downloaded += len(chunk)
            reporthook(downloaded // 8192, 8192, -1, context, start_time, last_log_time)

    zip_size_mb = zip_path.stat().st_size / 1024 / 1024
    context.log.info(f"Downloaded {zip_size_mb:.1f} MB in {time.time() - start_time:.1f}s")

    with zipfile.ZipFile(zip_path) as zf:
        zf.extractall(extract_dir)
        extracted = zf.namelist()
    context.log.info(f"Extracted {len(extracted)} files")
    # Dropped before uploading so the container only ever holds the extracted copy.
    zip_path.unlink()

    shp_paths: list[str] = []
    sha256: dict[str, str] = {}
    for file in extract_dir.rglob("*"):
        if not file.is_file():
            continue
        relative = file.relative_to(extract_dir)
        sha256[str(relative)] = sha256_file(file)
        key = f"{source_prefix}{relative}"
        s3.upload_file(str(file), S3_BUCKET, key)
        if file.suffix == ".shp":
            shp_paths.append(str(relative))

    shutil.rmtree(extract_dir)
    context.log.info(f"Uploaded {len(shp_paths)} shp files to s3://{S3_BUCKET}/{source_prefix}")
    return shp_paths, sha256
