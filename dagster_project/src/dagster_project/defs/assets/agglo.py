
import hashlib
import json
from pathlib import Path
import shutil
from datetime import datetime, timezone
from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile
from dagster_project.defs.jobs.tools import _db_url, download_from_s3, s3, S3_BUCKET, DAGSTER_ROOT

from dagster_project.defs.resources.box import BoxResource

def _agglo_033_entry(file: str, typesource: str, cbstype: str, indicetype: str, ignore_source: bool = False) -> dict:
    mapping = {
        "geometry": True,
        "legende": {"from": "category"},
        "typesource": {"value": typesource},
        "cbstype": {"value": cbstype},
        "indicetype": {"value": indicetype},
        "annee": {"value": "2022"},
        "codedept": {"value": "033"},
        "typeterr": {"value": "AGGLO"},
    }
    if not ignore_source:
        mapping["source"] = True

    return {"name": file, "mapping": mapping}


mapping_agglo_033 = [
    _agglo_033_entry("fer_depassement_de_seuil_Lden.shp","F", "C", "LD"),
    _agglo_033_entry("industrie_depassement_de_seuil_Lden.shp","I", "C", "LD"),
    _agglo_033_entry("route_depassement_de_seuil_Lden.shp","R", "C", "LD"),
    _agglo_033_entry("fer_depassement_de_seuil_Lnight.shp","F", "C", "LN"),
    _agglo_033_entry("industrie_depassement_de_seuil_Lnight.shp","I", "C", "LN"),
    _agglo_033_entry("route_depassement_de_seuil_Lnight.shp","R", "C", "LN"),

    _agglo_033_entry("NoiseContours_airportsInAgglomeration_Lden.shp","A", "A", "LD", ignore_source=True),
    _agglo_033_entry("NoiseContours_industryInAgglomeration_Lden.shp","I", "A", "LD", ignore_source=True),
    _agglo_033_entry("NoiseContours_railwaysInAgglomeration_Lden.shp","F", "A", "LD", ignore_source=True),
    _agglo_033_entry("NoiseContours_roadsInAgglomeration_Lden.shp","R", "A", "LD", ignore_source=True),
    _agglo_033_entry("NoiseContours_airportsInAgglomeration_Lnight.shp","A", "A", "LN", ignore_source=True),
    _agglo_033_entry("NoiseContours_industryInAgglomeration_Lnight.shp","I", "A", "LN", ignore_source=True),
    _agglo_033_entry("NoiseContours_railwaysInAgglomeration_Lnight.shp","F", "A", "LN", ignore_source=True),
    _agglo_033_entry("NoiseContours_roadsInAgglomeration_Lnight.shp","R", "A", "LN", ignore_source=True),
]

BOX_AGGLO_033_FOLDER_ID = "378891546195"

def agglo_launcher(context: AssetExecutionContext, box: BoxResource, folder_id:str, mapping: list[dict]):
    client = box.get_client()
    folder = client.folders.get_folder_by_id(folder_id)

    s3_path = f"noisemap/cbs_agglo/territory={folder.name}/campaign=2022/"
    source_prefix = s3_path + "_source/"
    mapping_key = s3_path + "mapping.json"
    manifest_key = s3_path + "manifest.json"
    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / f"agglo_{folder.name}"
    local_dir.mkdir(parents=True, exist_ok=True)

    items = client.folders.get_folder_items(folder_id)

    sha256 = {}
    for item in items.entries:
        if item.type != "file":
            continue
        context.log.info(f"Downloading {item.name} from Box")
        stream = client.downloads.download_file(item.id)
        content = stream.read()
        local_path = local_dir / item.name
        local_path.write_bytes(content)
        sha256[item.name] = hashlib.sha256(content).hexdigest()
        s3.upload_file(str(local_path), S3_BUCKET, f"{source_prefix}{item.name}")
        context.log.info(f"Uploaded {item.name} → s3://{S3_BUCKET}/{source_prefix}{item.name}")

    shutil.rmtree(local_dir)

    manifest = {
        "provenance": f"box://folder/{folder_id}",
        "pulled_at": datetime.now(timezone.utc).isoformat(),
        "sha256": sha256,
    }

    s3.put_object(Bucket=S3_BUCKET, Key=manifest_key, Body=json.dumps(manifest, indent=2), ContentType="application/json")
    context.log.info(f"Uploaded manifest → s3://{S3_BUCKET}/{manifest_key}")

    s3.put_object(Bucket=S3_BUCKET, Key=mapping_key, Body=json.dumps(mapping, indent=2), ContentType="application/json")
    context.log.info(f"Uploaded mapping → s3://{S3_BUCKET}/{mapping_key}")
    return MaterializeResult(metadata={
        "box_id": MetadataValue.text(BOX_AGGLO_033_FOLDER_ID),
        "bucket": MetadataValue.text(S3_BUCKET),
        "prefix": MetadataValue.text(s3_path),
        "files_uploaded": MetadataValue.int(len(sha256)),
        "mapping": MetadataValue.json(mapping),
        "manifest": MetadataValue.json(manifest),
    })

@asset(group_name="launcher", key="agglo_033")
def agglo_033_launcher(context: AssetExecutionContext, box: BoxResource):
    return(agglo_launcher(context=context, box=box, folder_id=BOX_AGGLO_033_FOLDER_ID, mapping=mapping_agglo_033))

@asset(group_name="landing", key="raw_agglo", deps=["agglo_033"])
def agglo_landing(context: AssetExecutionContext):
    """Download agglo 033 files from S3 and ingest into public_workspace.raw_noisemap."""
    base_s3_path = "noisemap/cbs_agglo/territory=bordeaux-metropole/campaign=2022/"
    source_s3_path = base_s3_path + "_source/"
    mapping_s3_key = base_s3_path + "mapping.json"

    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / "agglo_033"
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

        context.log.info(f"Ingesting {entry['name']} → raw_noisemap")
        success = ingest_shapefile(
            str(shp_path),
            "raw_noisemap",
            _db_url(),
            schema="public_workspace",
            if_exists="append",
            mapping=entry.get("mapping"),
        )
        if success:
            ingested += 1
        else:
            context.log.error(f"Failed to ingest {entry['file']}")

    shutil.rmtree(local_dir)
    context.log.info(f"Cleaned up {local_dir}")

    return MaterializeResult(metadata={
        "files_downloaded": MetadataValue.int(downloaded),
        "files_ingested": MetadataValue.int(ingested),
        "files_skipped": MetadataValue.int(skipped),
    })
