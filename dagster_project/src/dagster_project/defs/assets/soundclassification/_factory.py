"""Mapping helpers and launcher/landing logic for soundclassification ingestion.

The actual @asset definitions live in defs.py — this module holds per-territory
mapping construction and the shared launcher/landing helpers so defs.py stays
focused on Dagster wiring.
"""

import hashlib
import json
import shutil
from datetime import datetime, timezone

from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, StaticPartitionsDefinition

from dagster_project.io import DAGSTER_ROOT
from dagster_project.io.s3 import S3_BUCKET, s3
from dagster_project.defs.assets.noisemap._io import s3_landing
from dagster_project.defs.resources.box import BoxResource

from dagster_project.defs.assets.soundclassification._registry import (
    SOUNDCLASSIFICATION_TERRITORIES,
    SoundclassificationTerritory,
)

GROUP = "soundclassification"

SOUNDCLASS_BY_DEPT: dict[str, SoundclassificationTerritory] = {
    t.dept: t for t in SOUNDCLASSIFICATION_TERRITORIES
}

SOUNDCLASS_PARTITIONS = StaticPartitionsDefinition([t.dept for t in SOUNDCLASSIFICATION_TERRITORIES])

_MODE_MAPPINGS: dict[str, dict] = {
    "fer": {
        "geometry": True,
        "label": {"from":"ligne"},
        "acoustic_category": {"from":"rang"},
        "pkdebssseg": True,
        "pkfinssseg": True,
        "long_ssseg": True,
        "lidebssseg": True,
        "lifinsseg": True,
        "nvx_class": True,
        "base_class": True,
        "publi_ap": True,
        "evol_class": True,
        "acoustic_buffer": {"from":"sect_affec"},
        "communes": True,
        "region": True,
        "dept": True,
        "code_dept": True,
    },
    "routier": {
        "geometry": True,
        "numero": True,
        "segment": {"from": "nom_tronc"},
        "debutant": True,
        "finissant": True,
        "cls_commen": True,
        "acoustic_category": {"from":"cat_bruit"},
        "gestion": True,
        "horizon": True,
        "communes": True,
        "projet": True,
        "acoustic_buffer": {"from":"larg_secte"},

    },
    "lgv": {
        "geometry": True,
        "id": True,
        "nature": True,
        "pos_sol": True,
        "etat": True,
        "date_creat": True,
        "date_maj": True,
        "date_conf": True,
        "electrifie": True,
        "largeur": True,
        "nb_voies": True,
        "id_vfn": True,
        "label": {"from":"toponyme"},
        "acoustic_buffer": {"from":"larg_secte"},
        "acoustic_category": {"from":"cat"},

    },
    "tramway": {
        "geometry": True,
        "label": {"from":"id"},
        "nature": True,
        "etat": True,
        "electrifie": True,
        "largeur": True,
        "nb_voies": True,
        "acoustic_buffer": {"from":"larg_secte"},
        "acoustic_category": {"from":"categorie"},
    },
}


def s3_prefix(dept: str, campaign: str, mode: str) -> str:
    return f"soundclassification/dept={dept}/campaign={campaign}/mode={mode}/"


def _build_mode_mapping(file: str, mode: str, dept: str) -> dict:
    """Return the per-shapefile column mapping for a given mode, injecting codedept."""
    mapping = dict(_MODE_MAPPINGS[mode])
    mapping["codedept"] = {"value": dept}
    return {"name": file, "mapping": mapping}


def launch_from_box(context: AssetExecutionContext, t: SoundclassificationTerritory, box: BoxResource) -> MaterializeResult:
    """Download all soundclassification files from Box and upload to S3 per mode."""
    client = box.get_client()
    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / f"soundclassification_{t.dept}"
    local_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Download all files from the Box folder once
        all_sha256: dict[str, str] = {}
        items = client.folders.get_folder_items(t.box_id)
        for item in items.entries:
            if item.type != "file":
                continue
            context.log.info(f"Downloading {item.name} from Box folder {t.box_id}")
            stream = client.downloads.download_file(item.id)
            content = stream.read()
            (local_dir / item.name).write_bytes(content)
            all_sha256[item.name] = hashlib.sha256(content).hexdigest()

        context.log.info(f"Downloaded {len(all_sha256)} files from Box")

        mode_count = 0
        for src in t.sources:
            path = s3_prefix(t.dept, t.campaign, src.mode)
            source_prefix = path + "_source/"

            mode_sha256: dict[str, str] = {}
            mapping_entries = []

            for local_file in local_dir.iterdir():
                if not local_file.is_file() or local_file.stem != src.file_stem:
                    continue
                s3.upload_file(str(local_file), S3_BUCKET, f"{source_prefix}{local_file.name}")
                context.log.info(f"Uploaded {local_file.name} → s3://{S3_BUCKET}/{source_prefix}{local_file.name}")
                mode_sha256[local_file.name] = all_sha256[local_file.name]
                if local_file.suffix == ".shp":
                    mapping_entries.append(_build_mode_mapping(local_file.name, src.mode, t.dept))

            manifest = {
                "provenance": f"box://folder/{t.box_id}",
                "pulled_at": datetime.now(timezone.utc).isoformat(),
                "sha256": mode_sha256,
            }
            s3.put_object(
                Bucket=S3_BUCKET, Key=path + "manifest.json",
                Body=json.dumps(manifest, indent=2), ContentType="application/json",
            )
            s3.put_object(
                Bucket=S3_BUCKET, Key=path + "mapping.json",
                Body=json.dumps(mapping_entries, indent=2), ContentType="application/json",
            )
            context.log.info(
                f"Mode {src.mode}: {len(mapping_entries)} mapping entries → s3://{S3_BUCKET}/{path}"
            )
            mode_count += 1

    finally:
        shutil.rmtree(local_dir, ignore_errors=True)

    return MaterializeResult(metadata={
        "box_id": MetadataValue.text(t.box_id),
        "bucket": MetadataValue.text(S3_BUCKET),
        "modes_uploaded": MetadataValue.int(mode_count),
        "files_downloaded": MetadataValue.int(len(all_sha256)),
        "mapping": MetadataValue.json(mapping_entries),
        "manifest": MetadataValue.json(manifest),
    })


def run_landing(context: AssetExecutionContext, t: SoundclassificationTerritory) -> MaterializeResult:
    """Download soundclassification files from S3 and ingest into per-mode raw tables."""
    total = {"files_downloaded": 0, "files_ingested": 0, "files_skipped": 0}

    for src in t.sources:
        path = s3_prefix(t.dept, t.campaign, src.mode)
        result = s3_landing(context=context, path=path, db_table=src.db_table)
        for key in total:
            if key in result.metadata:
                total[key] += result.metadata[key].value

    return MaterializeResult(metadata={
        "files_downloaded": MetadataValue.int(total["files_downloaded"]),
        "files_ingested": MetadataValue.int(total["files_ingested"]),
        "files_skipped": MetadataValue.int(total["files_skipped"]),
    })
