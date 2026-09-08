import json
import os
import shutil
from datetime import datetime, timezone

from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset
from sqlalchemy import create_engine, inspect, text

from dagster_project.defs.assets.cadastre._partitions import CADASTRE_PARTITIONS, to_etalab_code
from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile
from dagster_project.io import DAGSTER_ROOT
from dagster_project.io.db import db_url
from dagster_project.io.s3 import S3_BUCKET, download_extract_upload, download_from_s3, s3

GROUP = "cadastre"
SOURCE = "data.gouv"
DB_TABLE = "raw_cadastre_parcelles"
SCHEMA = "public_workspace"

# Etalab publishes a quarterly snapshot; there is no "latest" alias, so the release
# is pinned here. Bumping it is a deliberate act: the sonoscore batch records which
# cadastre release a run was computed against.
CADASTRE_RELEASE = "2026-06-01"
BASE_URL = "https://files.data.gouv.fr/cadastre/etalab-cadastre"

# Department the committed CI fixture belongs to (Bordeaux + Mérignac parcels).
FIXTURE_DEPT = "033"

# A department holds up to ~2M parcels; read them in slices so peak memory stays
# flat instead of scaling with the department. Measured on dept 033, above a 127 MB
# baseline: 50k rows costs ~150 MB, 100k costs ~270 MB. Raise it on a bigger container.
CHUNK_FEATURES = int(os.getenv("CADASTRE_CHUNK_FEATURES", "50000"))


def _source_url(dept: str) -> str:
    code = to_etalab_code(dept)
    return f"{BASE_URL}/{CADASTRE_RELEASE}/shp/departements/{code}/cadastre-{code}-parcelles-shp.zip"


def _s3_prefix(dept: str) -> str:
    return f"cadastre/parcelles/release={CADASTRE_RELEASE}/dept={dept}/"


@asset(
    name="cadastre_parcelles_launcher",
    partitions_def=CADASTRE_PARTITIONS,
    group_name=GROUP,
    tags={"stage": "launcher", "source": SOURCE},
    kinds={"s3"},
)
def cadastre_parcelles_launcher(context: AssetExecutionContext):
    """Download the Etalab parcelles ZIP for one dept and upload its shapefile to S3."""
    dept = context.partition_key
    url = _source_url(dept)
    prefix = _s3_prefix(dept)
    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / f"cadastre_{dept}"

    context.log.info(f"Downloading cadastre parcelles for dept={dept} from {url}")
    try:
        shp_paths, sha256 = download_extract_upload(url, local_dir, prefix + "_source/", context)

        manifest = {
            "provenance": url,
            "release": CADASTRE_RELEASE,
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
        "release": MetadataValue.text(CADASTRE_RELEASE),
        "source_url": MetadataValue.url(url),
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(prefix),
        "shp_files": MetadataValue.int(len(shp_paths)),
    })


@asset(
    name="cadastre_parcelles_landing",
    partitions_def=CADASTRE_PARTITIONS,
    group_name=GROUP,
    tags={"stage": "landing", "source": SOURCE},
    kinds={"s3", "postgres"},
    deps=["cadastre_parcelles_launcher"],
)
def cadastre_parcelles_landing(context: AssetExecutionContext):
    """Download the parcelles shapefile from S3 and ingest it into raw_cadastre_parcelles."""
    dept = context.partition_key
    source_prefix = _s3_prefix(dept) + "_source/"
    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / f"cadastre_landing_{dept}"
    local_dir.mkdir(parents=True, exist_ok=True)

    ingested = 0

    try:
        downloaded = download_from_s3(bucket=S3_BUCKET, file_path=local_dir, s3_path=source_prefix, context=context)
        if downloaded == 0:
            raise FileNotFoundError(
                f"No source files at s3://{S3_BUCKET}/{source_prefix} — run cadastre_parcelles_launcher first"
            )

        engine = create_engine(db_url())
        if DB_TABLE in inspect(engine).get_table_names(schema=SCHEMA):
            with engine.begin() as conn:
                result = conn.execute(
                    text(f'DELETE FROM {SCHEMA}."{DB_TABLE}" WHERE codedept = :dept'),
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
                fixed_columns={"codedept": dept, "release": CADASTRE_RELEASE},
                chunk_features=CHUNK_FEATURES,
                context=context,
            )
            if success:
                ingested += 1
            else:
                raise RuntimeError(f"Failed to ingest {shp_path.name} for dept={dept}")

    finally:
        shutil.rmtree(local_dir, ignore_errors=True)

    with create_engine(db_url()).connect() as conn:
        row_count = conn.execute(
            text(f'SELECT count(*) FROM {SCHEMA}."{DB_TABLE}" WHERE codedept = :dept'),
            {"dept": dept},
        ).scalar_one()

    return MaterializeResult(metadata={
        "dept": MetadataValue.text(dept),
        "release": MetadataValue.text(CADASTRE_RELEASE),
        "files_ingested": MetadataValue.int(ingested),
        "row_count": MetadataValue.int(row_count),
    })


@asset(
    name="cadastre_parcelles_fixture",
    group_name=GROUP,
    tags={"stage": "fixture", "source": "local"},
    kinds={"postgres"},
)
def cadastre_parcelles_fixture(context: AssetExecutionContext):
    """Seed raw_cadastre_parcelles from the committed 500-parcel extract.

    A real department extract is ~2M rows / 358 MB, far too heavy to land per CI
    run, so CI provisions the source table from this fixture instead. `if_exists`
    is "skip": once a real landing has created the table this asset is a no-op, and
    the rows it seeds carry codedept="033", which the real 033 landing deletes
    before appending.

    Tagged stage="fixture", not "landing", so run_pipelines.py never selects it —
    it would otherwise mix an unpartitioned asset into a dept-partitioned domain.
    """
    file_path = DAGSTER_ROOT / "reference_data" / "cadastre" / "parcelles.shp"
    context.log.info(f"Ingesting {file_path.name} → {DB_TABLE} (fixture)")
    success = ingest_shapefile(
        str(file_path),
        DB_TABLE,
        db_url(),
        schema=SCHEMA,
        if_exists="skip",
        fixed_columns={"codedept": FIXTURE_DEPT, "release": CADASTRE_RELEASE},
        context=context,
    )
    if not success:
        raise RuntimeError(f"Failed to ingest the cadastre fixture from {file_path}")

    return MaterializeResult(metadata={
        "source": MetadataValue.path(str(file_path)),
        "codedept": MetadataValue.text(FIXTURE_DEPT),
    })


@asset(
    group_name=GROUP,
    key="raw_cadastre_parcelles",
    deps=["cadastre_parcelles_landing"],
)
def raw_cadastre_parcelles(context: AssetExecutionContext):
    context.log.info("raw_cadastre_parcelles fan-in: all upstream partitions ready")
    return MaterializeResult(metadata={"status": MetadataValue.text("ok")})
