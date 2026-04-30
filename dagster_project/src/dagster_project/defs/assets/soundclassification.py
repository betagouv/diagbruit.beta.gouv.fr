import hashlib
import json
from datetime import datetime, timezone
from functools import partial

from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.defs.jobs.tools import  s3, S3_BUCKET, DAGSTER_ROOT

SOUNDCLASS_LOCAL_DIR = DAGSTER_ROOT / "ingestion" / "inputs" / "soundclassification" / "AGGLO_033"

SOUNDCLASS_MAP = {
    "ROUTIER": {"mode": "routier", "routier": True},
    "FER":     {"mode": "fer",     "routier": False},
    "LGV":     {"mode": "lgv",     "routier": False},
    "TRAMWAY": {"mode": "tramway", "routier": False},
}

def rename_soundclass_033(file: str, routier: bool = False) -> dict:
    return {
        "name": file,
        "mapping": {
            "segment": {"from": "nom_tronc"} if routier else True,
            "ligne": True,
            "rang": True,
            "pkdebssseg": True,
            "pkfinssseg": True,
            "long_ssseg": True,
            "lidebssseg": True,
            "lifinsseg": True,
            "nvx_class": True,
            "base_class": True,
            "publi_ap": True,
            "evol_class": True,
            "sect_affect": True,
            "communes": True,
            "region": True,
            "dept": True,
            "geomtry": True,
            "code_dept": True,
            "codedept": {"value": "033"},
        },
    }


@asset(group_name="launcher", key="soundclass_033_launcher")
def soundclass_033_launcher(context: AssetExecutionContext):
    all_sha256 = {}
    all_mappings = {}

    for folder_name, meta in SOUNDCLASS_MAP.items():
        mode = meta["mode"]
        routier = meta["routier"]
        s3_path = f"soundclassification/dept=033/campaign=2022/mode={mode}/"
        source_prefix = s3_path + "_source/"
        local_mode_dir = SOUNDCLASS_LOCAL_DIR / folder_name

        if not local_mode_dir.exists():
            context.log.warning(f"Folder not found, skipping: {local_mode_dir}")
            continue

        mapping_entries = []
        for file in local_mode_dir.iterdir():
            if not file.is_file():
                continue
            sha256 = hashlib.sha256(file.read_bytes()).hexdigest()
            all_sha256[f"{folder_name}/{file.name}"] = sha256
            s3.upload_file(str(file), S3_BUCKET, f"{source_prefix}{file.name}")
            context.log.info(f"Uploaded {file.name} → s3://{S3_BUCKET}/{source_prefix}{file.name}")
            if file.suffix == ".shp":
                mapping_entries.append(rename_soundclass_033(file.name, routier=routier))

        mapping_key = s3_path + "mapping.json"
        s3.put_object(Bucket=S3_BUCKET, Key=mapping_key, Body=json.dumps(mapping_entries, indent=2), ContentType="application/json")
        context.log.info(f"Uploaded mapping → s3://{S3_BUCKET}/{mapping_key}")
        all_mappings[mode] = mapping_entries
        manifest = {
            "provenance": str(SOUNDCLASS_LOCAL_DIR),
            "pulled_at": datetime.now(timezone.utc).isoformat(),
            "sha256": all_sha256,
        }
        manifest_key = s3_path + "manifest.json"
        s3.put_object(Bucket=S3_BUCKET, Key=manifest_key, Body=json.dumps(manifest, indent=2), ContentType="application/json")
        context.log.info(f"Uploaded manifest → s3://{S3_BUCKET}/{manifest_key}")

    return MaterializeResult(metadata={
        "bucket": MetadataValue.text(S3_BUCKET),
        "modes_uploaded": MetadataValue.int(len(all_mappings)),
        "files_uploaded": MetadataValue.int(len(all_sha256)),
        "manifest": MetadataValue.json(manifest),
    })

@asset(group_name="launcher", key="soundclass_044_launcher")
def soundclass_044_launcher(context: AssetExecutionContext):
    for meta in SOUNDCLASS_URL_044:
        mode = meta["mode"]
        path = f"soundclassification/dept=044/campaign=2022/mode={mode}/"
        callback = partial(rename_soundclass_044, mode=meta["mode"])
        s3_launcher(context=context, path=path, arr_url=[meta["url"]], callback=callback)
    return MaterializeResult(metadata={
        "bucket": MetadataValue.text(S3_BUCKET),
        "modes_uploaded": MetadataValue.int(len(SOUNDCLASS_URL_044)),
    })


@asset(group_name="landing", key="soundclass_033_landing", deps=["soundclass_033_launcher"])
def soundclass_033_landing(context: AssetExecutionContext):
    total = {"files_downloaded": 0, "files_ingested": 0, "files_skipped": 0}

    for meta in SOUNDCLASS_MAP.values():
        mode = meta["mode"]
        path = f"soundclassification/dept=033/campaign=2022/mode={mode}/"
        result = s3_landing(context=context, path=path, db_name= f"raw_soundclassification_{mode}")
        for key in total:
            if key in result.metadata:
                total[key] += result.metadata[key].value

    return MaterializeResult(metadata={
        "files_downloaded": MetadataValue.int(total["files_downloaded"]),
        "files_ingested": MetadataValue.int(total["files_ingested"]),
        "files_skipped": MetadataValue.int(total["files_skipped"]),
    })