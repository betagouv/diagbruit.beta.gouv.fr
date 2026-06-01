import json
import shutil
from datetime import datetime, timezone

from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.defs.assets.peb._registry import PEB_TERRITORIES, PebTerritory
from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile
from dagster_project.io import DAGSTER_ROOT
from dagster_project.io.db import db_url
from dagster_project.io.s3 import S3_BUCKET, download_from_s3, download_upload, s3

GROUP = "peb"
SOURCE = "data.gouv"

_TERRITORY: PebTerritory = PEB_TERRITORIES[0]


def _s3_prefix(t: PebTerritory) -> str:
    return f"peb/scope={t.scope}/"


def _local_dir(t: PebTerritory):
    return DAGSTER_ROOT / "ingestion" / "inputs" / f"peb_{t.scope}"


@asset(
    key="peb_launcher",
    group_name=GROUP,
    tags={"stage": "launcher", "source": SOURCE},
    kinds={"s3"},
)
def peb_launcher(context: AssetExecutionContext):
    """Download PEB GeoJSON (one per zone) from data.gouv.fr into S3 under peb/scope=.../_source/."""
    t = _TERRITORY
    s3_path = _s3_prefix(t)
    source_prefix = s3_path + "_source/"
    local_dir = _local_dir(t)

    sha256 = {}
    for i, url in enumerate(t.urls):
        context.log.info(f"[{i + 1}/{len(t.urls)}] Downloading {url}")
        filename, digest = download_upload(url, local_dir, source_prefix, context)
        sha256[filename] = digest

    shutil.rmtree(local_dir, ignore_errors=True)

    manifest = {
        "provenance": t.urls,
        "pulled_at": datetime.now(timezone.utc).isoformat(),
        "sha256": sha256,
    }
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=s3_path + "manifest.json",
        Body=json.dumps(manifest, indent=2),
        ContentType="application/json",
    )
    context.log.info(f"Uploaded manifest → s3://{S3_BUCKET}/{s3_path}manifest.json")

    return MaterializeResult(metadata={
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(s3_path),
        "files_uploaded": MetadataValue.int(len(sha256)),
        "manifest": MetadataValue.json(manifest),
    })


@asset(
    key="raw_peb",
    group_name=GROUP,
    tags={"stage": "landing", "source": SOURCE},
    kinds={"s3", "postgres"},
    deps=["peb_launcher"],
)
def peb_landing(context: AssetExecutionContext):
    """Download PEB GeoJSON from S3 and ingest into public_workspace.raw_peb.

    The source columns (UPPERCASE) already match the dbt schema once lowercased
    by ingest_shapefile, so no mapping is needed — every field is kept.
    """
    t = _TERRITORY
    s3_path = _s3_prefix(t) + "_source/"
    local_dir = _local_dir(t)
    local_dir.mkdir(parents=True, exist_ok=True)

    downloaded = download_from_s3(bucket=S3_BUCKET, file_path=local_dir, s3_path=s3_path, context=context)

    if downloaded == 0:
        context.log.warning(f"No files found at s3://{S3_BUCKET}/{s3_path}")
        shutil.rmtree(local_dir, ignore_errors=True)
        return MaterializeResult(metadata={
            "files_downloaded": MetadataValue.int(0),
            "files_ingested": MetadataValue.int(0),
        })

    ingested = 0
    # All zones share one table: replace on the first file, append the rest.
    for i, geojson in enumerate(sorted(local_dir.rglob("*.geojson"))):
        if_exists = "replace" if i == 0 else "append"
        context.log.info(f"Ingesting {geojson.name} → raw_peb (if_exists={if_exists})")
        success = ingest_shapefile(
            str(geojson), "raw_peb", db_url(),
            schema="public_workspace", if_exists=if_exists, context=context,
        )
        if success:
            ingested += 1
        else:
            context.log.error(f"Failed to ingest {geojson.name} → raw_peb")

    shutil.rmtree(local_dir, ignore_errors=True)

    return MaterializeResult(metadata={
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(s3_path),
        "files_downloaded": MetadataValue.int(downloaded),
        "files_ingested": MetadataValue.int(ingested),
        "scope": MetadataValue.text(t.scope),
    })
