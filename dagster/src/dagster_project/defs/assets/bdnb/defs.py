import hashlib
import json
import shutil
from datetime import datetime, timezone

from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, StaticPartitionsDefinition, asset
from sqlalchemy import create_engine, inspect, text

from dagster_project.defs.resources.box import BoxResource
from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile
from dagster_project.io import DAGSTER_ROOT
from dagster_project.io.db import db_url
from dagster_project.io.s3 import S3_BUCKET, s3

GROUP = "bdnb"
DB_TABLE = "raw_bdnb"
SCHEMA = "public_workspace"
BOX_ID = "386454836882"
IGNORE_COLUMNS = ["fictive_ha", "fictive_ge"]

BDNB_PARTITIONS = StaticPartitionsDefinition(["019", "033", "035", "044", "059", "067"])


def _s3_prefix(dept: str) -> str:
    return f"bdnb/dept={dept}/"


def _download_box_folder(client, folder_id: str, local_dir) -> dict[str, str]:
    """Recursively download all files from a Box folder into local_dir.

    Returns a sha256 dict keyed by filename.
    """
    local_dir.mkdir(parents=True, exist_ok=True)
    sha256 = {}
    items = client.folders.get_folder_items(folder_id)
    for item in items.entries:
        if item.type == "file":
            stream = client.downloads.download_file(item.id)
            content = stream.read()
            (local_dir / item.name).write_bytes(content)
            sha256[item.name] = hashlib.sha256(content).hexdigest()
        elif item.type == "folder":
            sha256.update(_download_box_folder(client, item.id, local_dir / item.name))
    return sha256


@asset(
    name="bdnb_launcher",
    partitions_def=BDNB_PARTITIONS,
    group_name=GROUP,
    kinds={"box", "s3"},
)
def bdnb_launcher(context: AssetExecutionContext, box: BoxResource):
    """Download BDNB shapefiles for one dept from Box and upload to S3."""
    dept = context.partition_key
    client = box.get_client()
    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / f"bdnb_{dept}"
    local_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Find the matching DEPT_XXX subfolder in Box
        items = client.folders.get_folder_items(BOX_ID)
        dept_folder = next(
            (item for item in items.entries if item.type == "folder" and item.name.split("_", 1)[-1] == dept),
            None,
        )
        if dept_folder is None:
            raise ValueError(f"No Box folder found for dept={dept}")

        context.log.info(f"Downloading from Box folder {dept_folder.name!r}")
        sha256 = _download_box_folder(client, dept_folder.id, local_dir)
        context.log.info(f"Downloaded {len(sha256)} file(s)")

        prefix = _s3_prefix(dept)
        source_prefix = prefix + "_source/"

        for local_file in local_dir.rglob("*"):
            if not local_file.is_file():
                continue
            s3_key = source_prefix + local_file.name
            s3.upload_file(str(local_file), S3_BUCKET, s3_key)
            context.log.info(f"Uploaded {local_file.name} → s3://{S3_BUCKET}/{s3_key}")

        manifest = {
            "provenance": f"box://folder/{BOX_ID}/{dept_folder.name}",
            "pulled_at": datetime.now(timezone.utc).isoformat(),
            "sha256": sha256,
        }
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=prefix + "manifest.json",
            Body=json.dumps(manifest, indent=2),
            ContentType="application/json",
        )

    finally:
        shutil.rmtree(local_dir, ignore_errors=True)

    return MaterializeResult(metadata={
        "dept": MetadataValue.text(dept),
        "bucket": MetadataValue.text(S3_BUCKET),
        "files_uploaded": MetadataValue.int(len(sha256)),
    })


@asset(
    name="bdnb_landing",
    partitions_def=BDNB_PARTITIONS,
    group_name=GROUP,
    kinds={"s3", "postgres"},
    deps=["bdnb_launcher"],
)
def bdnb_landing(context: AssetExecutionContext):
    """Download BDNB shapefiles from S3 and ingest into raw_bdnb."""
    dept = context.partition_key
    prefix = _s3_prefix(dept)
    source_prefix = prefix + "_source/"

    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / f"bdnb_landing_{dept}"
    local_dir.mkdir(parents=True, exist_ok=True)

    ingested = 0

    try:
        response = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix=source_prefix)
        for obj in response.get("Contents", []):
            filename = obj["Key"].split("/")[-1]
            s3.download_file(S3_BUCKET, obj["Key"], str(local_dir / filename))
            context.log.info(f"Downloaded {filename}")

        engine = create_engine(db_url())
        if DB_TABLE in inspect(engine).get_table_names(schema=SCHEMA):
            with engine.begin() as conn:
                result = conn.execute(
                    text(f'DELETE FROM {SCHEMA}."{DB_TABLE}" WHERE code_depar = :dept'),
                    {"dept": dept},
                )
                context.log.info(f"Deleted {result.rowcount} existing rows for dept={dept}")
        else:
            context.log.info(f"Table {DB_TABLE} does not exist yet — skipping pre-ingest DELETE")

        for shp_path in local_dir.rglob("*.shp"):
            context.log.info(f"Ingesting {shp_path.name} → {DB_TABLE}")
            success = ingest_shapefile(
                str(shp_path),
                DB_TABLE,
                db_url(),
                schema=SCHEMA,
                if_exists="append",
                fixed_columns={"code_depar": dept},
                ignore_columns=IGNORE_COLUMNS,
                context=context,
            )
            if success:
                ingested += 1
            else:
                context.log.error(f"Failed to ingest {shp_path.name}")

    finally:
        shutil.rmtree(local_dir, ignore_errors=True)

    return MaterializeResult(metadata={
        "dept": MetadataValue.text(dept),
        "files_ingested": MetadataValue.int(ingested),
    })

@asset(
    group_name=GROUP,
    key="raw_bdnb",
    deps=["bdnb_landing"],
)
def raw_bdnb(context: AssetExecutionContext):
    context.log.info("raw_bdnb fan-in: all upstream partitions ready")
    return MaterializeResult(metadata={"status": MetadataValue.text("ok")})