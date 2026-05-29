import json
import shutil

from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.defs.assets.peb._registry import PEB_TERRITORIES, PebTerritory
from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile
from dagster_project.io import DAGSTER_ROOT
from dagster_project.io.db import db_url
from dagster_project.io.manifest import manifest_file
from dagster_project.io.s3 import S3_BUCKET, download_from_s3, s3

GROUP = "peb"
SOURCE = "local"

# Single national PEB dataset for now. The registry pattern keeps the door
# open for additional campaigns / scopes without touching asset wiring.
_TERRITORY: PebTerritory = PEB_TERRITORIES[0]


def _s3_prefix(t: PebTerritory) -> str:
    return f"peb/scope={t.scope}/"


def _peb_mapping() -> dict:
    """Mapping schema for raw_peb ingest.

    Whitelists exactly the columns dbt staging reads. `campaign` is derived
    per row in dbt from `date_arret`, so nothing campaign-related is injected
    at ingest time.
    """
    return {
        "geometry": True,
        "zone": True,
        "indldenext": True,
        "indldenint": True,
        "code_oaci": True,
        "nom": True,
        "date_arret": True,
        "producteur": True,
        "date_maj": True,
        "ref_doc": True,
        "id_map": True,
    }


@asset(
    key="peb_launcher",
    group_name=GROUP,
    tags={"stage": "launcher", "source": SOURCE},
    kinds={"s3"},
)
def peb_launcher(context: AssetExecutionContext):
    """Upload PEB SHP into S3 under peb/scope=.../campaign=.../_source/."""
    t = _TERRITORY
    s3_path = _s3_prefix(t)
    input_dir = DAGSTER_ROOT / "ingestion" / "inputs" / t.local_dir

    manifest = manifest_file(input_dir)
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=s3_path + "manifest.json",
        Body=json.dumps(manifest, indent=2),
        ContentType="application/json",
    )
    context.log.info(f"Uploaded manifest → s3://{S3_BUCKET}/{s3_path}manifest.json")

    uploaded = 0
    for file in input_dir.rglob("*"):
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
    """Download PEB source files from S3 and ingest into public_workspace.raw_peb."""
    t = _TERRITORY
    s3_path = _s3_prefix(t) + "_source/"
    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / t.local_dir
    local_dir.parent.mkdir(parents=True, exist_ok=True)

    downloaded = download_from_s3(bucket=S3_BUCKET, file_path=local_dir, s3_path=s3_path, context=context)

    if downloaded == 0:
        context.log.info(f"No files found at s3://{S3_BUCKET}/{s3_path}")
        return MaterializeResult(metadata={
            "bucket": MetadataValue.text(S3_BUCKET),
            "files_downloaded": MetadataValue.int(0),
        })

    shp_file = next(iter(local_dir.rglob("*.shp")))
    context.log.info(f"Ingesting {shp_file.name} → raw_peb (scope={t.scope})")

    success = ingest_shapefile(
        str(shp_file),
        "raw_peb",
        db_url(),
        schema="public_workspace",
        if_exists="replace",
        mapping=_peb_mapping(),
        context=context,
    )

    shutil.rmtree(local_dir)
    context.log.info(f"Deleted {local_dir}")

    return MaterializeResult(metadata={
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(s3_path),
        "files_downloaded": MetadataValue.int(downloaded),
        "scope": MetadataValue.text(t.scope),
        "success": MetadataValue.bool(success),
    })
