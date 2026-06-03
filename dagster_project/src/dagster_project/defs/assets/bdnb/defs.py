import shutil

from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset
from sqlalchemy import create_engine, text

from dagster_project.defs.resources.box import BoxResource
from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile
from dagster_project.io import DAGSTER_ROOT
from dagster_project.io.db import db_url

GROUP = "bdnb"
DB_TABLE = "raw_bdnb"
SCHEMA = "public_workspace"
BOX_ID = "386454836882"


def _download_box_folder(client, folder_id: str, local_dir) -> None:
    """Recursively download all files from a Box folder into local_dir."""
    local_dir.mkdir(parents=True, exist_ok=True)
    items = client.folders.get_folder_items(folder_id)
    for item in items.entries:
        if item.type == "file":
            stream = client.downloads.download_file(item.id)
            (local_dir / item.name).write_bytes(stream.read())
        elif item.type == "folder":
            _download_box_folder(client, item.id, local_dir / item.name)


@asset(
    name="bdnb_landing",
    group_name=GROUP,
    kinds={"box", "postgres"},
)
def bdnb_landing(context: AssetExecutionContext, box: BoxResource):
    """Download BDNB shapefiles from Box and ingest into raw_bdnb.

    Box folder structure: <box_id>/DEPT_033/, <box_id>/DEPT_067/, ...
    The dept is extracted from each subfolder name and written to code_depar.
    All shapefile columns are ingested as-is alongside code_depar.
    """
    client = box.get_client()
    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / "bdnb"
    local_dir.mkdir(parents=True, exist_ok=True)

    ingested_total = 0
    depts_processed = []
    engine = create_engine(db_url())

    try:
        items = client.folders.get_folder_items(BOX_ID)
        for item in items.entries:
            if item.type != "folder" or not item.name.upper().startswith("DEPT_"):
                context.log.info(f"Skipping {item.name!r}")
                continue

            dept = item.name.split("_", 1)[1]  # "DEPT_033" → "033"
            context.log.info(f"Processing dept={dept} from Box folder {item.name!r}")

            dept_dir = local_dir / item.name
            _download_box_folder(client, item.id, dept_dir)
            context.log.info(f"Downloaded all files for dept={dept}")

            # Idempotent: clear existing rows for this dept before re-ingesting
            try:
                with engine.begin() as conn:
                    result = conn.execute(
                        text(f'DELETE FROM {SCHEMA}."{DB_TABLE}" WHERE code_depar = :dept'),
                        {"dept": dept},
                    )
                    context.log.info(f"Deleted {result.rowcount} existing rows for dept={dept}")
            except Exception as e:
                context.log.warning(f"Pre-ingest DELETE skipped for dept={dept}: {e}")

            for shp_path in dept_dir.rglob("*.shp"):
                context.log.info(f"Ingesting {shp_path.name} → {DB_TABLE}")
                success = ingest_shapefile(
                    str(shp_path),
                    DB_TABLE,
                    db_url(),
                    schema=SCHEMA,
                    if_exists="append",
                    fixed_columns={"code_depar": dept},
                    ignore_columns=["fictive_ha", "fictive_ge"],
                    context=context,
                )
                if success:
                    ingested_total += 1
                else:
                    context.log.error(f"Failed to ingest {shp_path.name}")

            depts_processed.append(dept)

    finally:
        shutil.rmtree(local_dir, ignore_errors=True)

    return MaterializeResult(metadata={
        "depts_processed": MetadataValue.json(sorted(depts_processed)),
        "files_ingested": MetadataValue.int(ingested_total),
    })
