import hashlib
import time
import os
from pathlib import Path
import io
import shutil
import urllib.request
import zipfile
import boto3

from datetime import datetime, timezone
from dagster import AssetExecutionContext

S3_BUCKET = os.getenv("AWS_S3_BUCKET", "diagbruit")

s3 = boto3.client(
    "s3",
    region_name=os.getenv("AWS_DEFAULT_REGION", "eu-west-3"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

DAGSTER_ROOT = Path(__file__).resolve().parents[2]

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

def manifest_file(input_dir:str):
    sha256 = {
        str(file.relative_to(input_dir)): hashlib.sha256(file.read_bytes()).hexdigest()
        for file in input_dir.rglob("*")
        if file.is_file()
    }

    manifest = {
        "provenance": "test",
        "pulled_at": datetime.now(timezone.utc).isoformat(),
        "sha256": sha256,
    }

    return manifest


def download_from_s3(bucket: str, file_path: str, s3_path: str, context: AssetExecutionContext):
    """Downloads a repo/file from S3 and returns the number of files downloaded"""
    downloaded = 0

    paginator = s3.get_paginator("list_objects_v2")
    pages = paginator.paginate(Bucket=bucket, Prefix=s3_path)

    if(not pages) :
        context.log.info(f"No files found from s3://{bucket}/{s3_path}")
        return downloaded

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
