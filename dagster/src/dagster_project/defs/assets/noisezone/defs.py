import shutil

from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.defs.assets.noisemap._io import box_to_s3_launcher
from dagster_project.defs.resources.box import BoxResource
from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile
from dagster_project.io import DAGSTER_ROOT
from dagster_project.io.db import db_url
from dagster_project.io.s3 import S3_BUCKET, download_from_s3

GROUP = "noisezone"
SOURCE = "box"

BOX_FOLDER_ID = "390359250129"
LABEL_FROM = "label"
ALERT_SLUG_FROM = "alert_slug"

_S3_PREFIX = "noisezone/"
_LOCAL_DIR = DAGSTER_ROOT / "ingestion" / "inputs" / "noisezone"
_MAPPING = [
    {
        "name": "",
        "mapping": {
            "geometry": True,
            "label": {"from": LABEL_FROM},
            "alert_slug": {"from": ALERT_SLUG_FROM},
        },
    }
]


@asset(
    key="noisezone_launcher",
    group_name=GROUP,
    tags={"stage": "launcher", "source": SOURCE},
    kinds={"box", "s3"},
)
def noisezone_launcher(context: AssetExecutionContext, box: BoxResource):
    """Download the noisezone shapefile from Box and upload to S3."""
    return box_to_s3_launcher(
        context=context,
        path=_S3_PREFIX,
        type="noisezone",
        dept="national",
        box=box,
        folder_id=BOX_FOLDER_ID,
        mapping=_MAPPING,
    )


@asset(
    key="raw_noisezone",
    group_name=GROUP,
    tags={"stage": "landing", "source": SOURCE},
    kinds={"s3", "postgres"},
    deps=["noisezone_launcher"],
)
def noisezone_landing(context: AssetExecutionContext):
    """Download the noisezone shapefile from S3 and ingest into public_workspace.raw_noisezone."""
    s3_path = _S3_PREFIX + "_source/"
    _LOCAL_DIR.mkdir(parents=True, exist_ok=True)

    downloaded = download_from_s3(bucket=S3_BUCKET, file_path=_LOCAL_DIR, s3_path=s3_path, context=context)

    if downloaded == 0:
        shutil.rmtree(_LOCAL_DIR, ignore_errors=True)
        raise FileNotFoundError(
            f"No source files at s3://{S3_BUCKET}/{s3_path} — run noisezone_launcher first"
        )

    ingested = 0
    for i, shp in enumerate(sorted(_LOCAL_DIR.rglob("*.shp"))):
        if_exists = "replace" if i == 0 else "append"
        context.log.info(f"Ingesting {shp.name} → raw_noisezone (if_exists={if_exists})")
        success = ingest_shapefile(
            str(shp), "raw_noisezone", db_url(),
            schema="public_workspace", if_exists=if_exists, context=context,
        )
        if success:
            ingested += 1
        else:
            context.log.error(f"Failed to ingest {shp.name} → raw_noisezone")

    shutil.rmtree(_LOCAL_DIR, ignore_errors=True)

    return MaterializeResult(metadata={
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(s3_path),
        "files_downloaded": MetadataValue.int(downloaded),
        "files_ingested": MetadataValue.int(ingested),
    })
