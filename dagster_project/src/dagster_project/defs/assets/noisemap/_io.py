import hashlib
import json
import shutil
from typing import Callable

from datetime import datetime, timezone
from dagster import AssetExecutionContext, MaterializeResult, MetadataValue

from sqlalchemy import create_engine, inspect, text

from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile
from dagster_project.io import DAGSTER_ROOT
from dagster_project.io.db import db_url
from dagster_project.io.s3 import S3_BUCKET, download_extract_upload, download_from_s3, s3

from dagster_project.defs.resources.box import BoxResource


def _delete_dept_rows(
    context: AssetExecutionContext, db_table: str, dept: str, schema: str = "public_workspace"
) -> int:
    """Delete existing rows for `dept` from `schema.db_table` before re-ingesting.

    Idempotency primitive for partitioned re-runs — without it, re-materializing
    a dept partition appends duplicate rows to raw_noisemap. Safe to call when
    the table doesn't yet exist (returns 0 and swallows the error) since the
    first-ever materialization will create the table via ingest_shapefile.
    """
    engine = create_engine(db_url())
    sql = text(f'DELETE FROM "{schema}"."{db_table}" WHERE codedept = :dept')
    try:
        with engine.begin() as conn:
            result = conn.execute(sql, {"dept": dept})
            deleted = result.rowcount or 0
        context.log.info(
            f"Deleted {deleted} existing rows for dept={dept} from {schema}.{db_table}"
        )
        return deleted
    except Exception as e:
        # Table may not exist yet on first run, or codedept column may not be present.
        context.log.warning(
            f"Pre-ingest DELETE skipped on {schema}.{db_table} (dept={dept}): {e}"
        )
        return 0


def rename_infra(file:str) -> dict:
    return {
        "name": file,
        "mapping": {
            "geometry": True,
            "codedept": True,
            "label": {"from": "codinfra"},
            "campaign": {"from": "annee"},
            "acoustic_producer_kind": {"from": "typeterr"},
            "kind": {"from": "typesource"},
            "acoustic_noisemap_kind": {"from": "cbstype"},
            "acoustic_db_value": {"from": "legende"},
            "acoustic_time_range": {"from": "indicetype"},
        },
    }

def s3_launcher(context: AssetExecutionContext, path: str, arr_url: list[str], callback: Callable[..., dict] = rename_infra):
    source_prefix = path + "_source/"
    mapping_key = path + "mapping.json"

    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / path
    local_dir.mkdir(parents=True, exist_ok=True)

    mapping_entries = []
    all_sha256 = {}

    for i, url in enumerate(arr_url):
        context.log.info(f"[{i + 1}/{len(arr_url)}] Downloading {url}")
        shp_paths, sha256 = download_extract_upload(url, local_dir / f"zip_{i}", source_prefix, context)
        mapping_entries.extend(callback(p) for p in shp_paths)
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
        Body=json.dumps(mapping_entries, indent=2),
        ContentType="application/json",
    )
    context.log.info(f"Uploaded mapping → s3://{S3_BUCKET}/{mapping_key}")

    return MaterializeResult(metadata={
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(path),
        "mapping": MetadataValue.json(mapping_entries),
        "manifest": MetadataValue.json(manifest),
    })

def s3_landing(
    context: AssetExecutionContext,
    path: str,
    db_table: str,
    if_exist: str = "append",
    dept: str | None = None,
):
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

    # Idempotent re-ingest: clear prior rows for this dept before append.
    if dept is not None and if_exist == "append":
        _delete_dept_rows(context, db_table=db_table, dept=dept)

    ingested = 0
    skipped = 0

    for entry in mapping:
        shp_path = local_dir / entry["name"]
        if not shp_path.exists():
            context.log.warning(f"File not found, skipping: {entry['name']}")
            skipped += 1
            continue
        
        context.log.info(f"Ingesting {entry['name']} → {db_table}")
        success = ingest_shapefile(
            str(shp_path),
            db_table,
            db_url(),
            schema="public_workspace",
            if_exists=if_exist,
            mapping=entry.get("mapping"),
            context=context
        )
        if success:
            ingested += 1
        else:
            context.log.error(f"Failed to ingest {entry['name']} → {db_table} (path: {shp_path})")

    shutil.rmtree(local_dir)
    context.log.info(f"Cleaned up {local_dir}")

    return MaterializeResult(metadata={
        "files_downloaded": MetadataValue.int(downloaded),
        "files_ingested": MetadataValue.int(ingested),
        "files_skipped": MetadataValue.int(skipped),
    })

def _box_walk(client, folder_id: str, local_dir, source_prefix: str, context: AssetExecutionContext) -> tuple[dict, list[str]]:
    """Recursively download all files in a Box folder tree to local_dir and upload to S3."""
    sha256 = {}
    shp_files = []
    items = client.folders.get_folder_items(folder_id)
    for item in items.entries:
        if item.type == "folder":
            sub_sha256, sub_shp = _box_walk(client, item.id, local_dir, source_prefix, context)
            sha256.update(sub_sha256)
            shp_files.extend(sub_shp)
        elif item.type == "file":
            context.log.info(f"Downloading {item.name} from Box")
            stream = client.downloads.download_file(item.id)
            content = stream.read()
            local_path = local_dir / item.name
            local_path.write_bytes(content)
            sha256[item.name] = hashlib.sha256(content).hexdigest()
            s3.upload_file(str(local_path), S3_BUCKET, f"{source_prefix}{item.name}")
            context.log.info(f"Uploaded {item.name} → s3://{S3_BUCKET}/{source_prefix}{item.name}")
            if item.name.lower().endswith(".shp"):
                shp_files.append(item.name)
    return sha256, shp_files


def box_to_s3_launcher(context: AssetExecutionContext, path: str, box: BoxResource, type:str, dept:str, folder_id: str, mapping: list[dict] | None = None):
    client = box.get_client()

    source_prefix = path + "_source/"
    mapping_key = path + "mapping.json"
    manifest_key = path + "manifest.json"
    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / f"{type}_{dept}"
    local_dir.mkdir(parents=True, exist_ok=True)

    sha256, shp_files = _box_walk(client, folder_id, local_dir, source_prefix, context)

    context.log.info(f"Found {len(shp_files)} .shp file(s): {shp_files}")
    shutil.rmtree(local_dir)

    if mapping is not None:
        mapping_index = {entry["name"]: entry for entry in mapping}
        mapping_entries = []
        for actual_name in shp_files:
            entry = mapping_index.get(actual_name) or next(
                (e for key, e in mapping_index.items() if actual_name.endswith(key)),
                None,
            )
            if entry is None:
                context.log.warning(f"No mapping entry for {actual_name!r}, skipping")
                continue
            mapping_entries.append({**entry, "name": actual_name})
    else:
        mapping_entries = [rename_infra(f) for f in shp_files]
    context.log.info(f"Built {len(mapping_entries)} mapping entries")

    manifest = {
        "provenance": f"box://folder/{folder_id}",
        "pulled_at": datetime.now(timezone.utc).isoformat(),
        "sha256": sha256,
    }

    s3.put_object(Bucket=S3_BUCKET, Key=manifest_key, Body=json.dumps(manifest, indent=2), ContentType="application/json")
    context.log.info(f"Uploaded manifest → s3://{S3_BUCKET}/{manifest_key}")

    s3.put_object(Bucket=S3_BUCKET, Key=mapping_key, Body=json.dumps(mapping_entries, indent=2), ContentType="application/json")
    context.log.info(f"Uploaded mapping → s3://{S3_BUCKET}/{mapping_key}")
    return MaterializeResult(metadata={
        "box_id": MetadataValue.text(folder_id),
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(path),
        "files_uploaded": MetadataValue.int(len(sha256)),
        "mapping": MetadataValue.json(mapping_entries),
        "manifest": MetadataValue.json(manifest),
    })

def ingest_from_s3_landing(context: AssetExecutionContext, path:str, type:str,dept:str, db_table:str = "raw_noisemap",):
    source_s3_path = path + "_source/"
    mapping_s3_key = path + "mapping.json"

    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / f"{type}_{dept}"
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

    # Guard: validate mapping target columns against the existing table schema before deleting any rows. 
    # if no guard during mapping mismatch, the function will delete the old data.
    engine = create_engine(db_url())
    inspector = inspect(engine)
    if db_table in inspector.get_table_names(schema="public_workspace"):
        existing_cols = {col["name"] for col in inspector.get_columns(db_table, schema="public_workspace")}
        target_cols = {col for entry in mapping for col in (entry.get("mapping") or {})}
        missing = target_cols - existing_cols - {"geometry"}
        if missing:
            raise ValueError(
                f"Schema mismatch — mapping targets columns not present in {db_table}: "
                f"{sorted(missing)}. Re-run the launcher to regenerate the S3 mapping, then retry."
            )

    # Idempotent re-ingest: clear prior rows for this dept before append.
    _delete_dept_rows(context, db_table=db_table, dept=dept)

    ingested = 0
    skipped = 0

    for entry in mapping:
        shp_path = local_dir / entry["name"]
        if not shp_path.exists():
            context.log.warning(f"File not found, skipping: {entry['name']}")
            skipped += 1
            continue

        context.log.info(f"Ingesting {entry['name']} → {db_table}")
        success = ingest_shapefile(
            str(shp_path),
            db_table,
            db_url(),
            schema="public_workspace",
            if_exists="append",
            mapping=entry.get("mapping"),
            context=context
        )
        if success:
            ingested += 1
        else:
            context.log.error(f"Failed to ingest {entry['name']} → {db_table} (path: {shp_path})")

    shutil.rmtree(local_dir)
    context.log.info(f"Cleaned up {local_dir}")

    return MaterializeResult(metadata={
        "files_downloaded": MetadataValue.int(downloaded),
        "files_ingested": MetadataValue.int(ingested),
        "files_skipped": MetadataValue.int(skipped),
    })
