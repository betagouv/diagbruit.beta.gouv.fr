"""Mapping helpers and launcher/landing logic for soundclassification ingestion.

The actual @asset definitions live in defs.py — this module holds per-territory
mapping construction and the shared launcher/landing helpers so defs.py stays
focused on Dagster wiring.
"""

import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, StaticPartitionsDefinition

from dagster_project.io import DAGSTER_ROOT
from dagster_project.io.s3 import S3_BUCKET, s3
from dagster_project.defs.assets.noisemap._io import s3_landing
from dagster_project.defs.resources.box import BoxResource

from dagster_project.defs.assets.soundclassification._registry import (
    SOUNDCLASSIFICATION_TERRITORIES,
    SoundclassificationSource,
    SoundclassificationTerritory,
)

GROUP = "soundclassification"
SOURCE = "box"

SOUNDCLASS_BY_DEPT: dict[str, SoundclassificationTerritory] = {
    t.dept: t for t in SOUNDCLASSIFICATION_TERRITORIES
}

SOUNDCLASS_PARTITIONS = StaticPartitionsDefinition([t.dept for t in SOUNDCLASSIFICATION_TERRITORIES])

_COLUMNS_BY_MODE: dict[str, dict] = {
    "fer": {
        "label": {"value": ""},
        "acoustic_category": {"value": ""},
        "acoustic_buffer": {"value": ""},
    },
    "routier": {
        "numero": {"value": ""},
        "acoustic_category": {"value": ""},
        "acoustic_buffer": {"value": ""},
    },
    "lgv": {
        "label": {"value": ""},
        "acoustic_category": {"value": ""},
        "acoustic_buffer": {"value": ""},
    },
    "tramway": {
        "label": {"value": ""},
        "acoustic_category": {"value": ""},
        "acoustic_buffer": {"value": ""},
    },
}


def s3_prefix(dept: str, campaign: str, mode: str) -> str:
    return f"soundclassification/dept={dept}/campaign={campaign}/mode={mode}/"


def _collect_box_files(client, folder_id):
    """Recursively yield all file entries from a Box folder and its subfolders."""
    items = client.folders.get_folder_items(folder_id)
    for item in items.entries:
        if item.type == "file":
            yield item
        elif item.type == "folder":
            yield from _collect_box_files(client, item.id)


def _mode_mapping(t: SoundclassificationTerritory, src: SoundclassificationSource) -> dict:
    """Build the column mapping for one source mode, injecting territory-level values.

    Per-source *_from overrides take precedence over the mode defaults in _COLUMNS_BY_MODE.
    """
    columns = dict(_COLUMNS_BY_MODE[src.mode])
    if src.label_from is not None:
        columns["label"] = {"from": src.label_from}
    if src.acoustic_category_from is not None:
        columns["acoustic_category"] = {"from": src.acoustic_category_from}
    if src.acoustic_buffer_from is not None:
        columns["acoustic_buffer"] = {"from": src.acoustic_buffer_from}
    if src.segment_from is not None:
        columns["segment"] = {"from": src.segment_from}
    if src.numero_from is not None:
        columns["numero"] = {"from": src.numero_from}
    return {
        "geometry": True,
        "codedept": {"value": t.dept},
        **columns,
    }


def build_territory_mapping(t: SoundclassificationTerritory) -> list[dict]:
    """Return the full list of file mappings for a territory (one entry per source)."""
    return [{"name": src.file, "mapping": _mode_mapping(t, src)} for src in t.sources]


def launch_from_box(context: AssetExecutionContext, t: SoundclassificationTerritory, box: BoxResource) -> MaterializeResult:
    """Download all soundclassification files from Box and upload to S3 per mode."""
    client = box.get_client()
    local_dir = DAGSTER_ROOT / "ingestion" / "inputs" / f"soundclassification_{t.dept}"
    local_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Download all files from the Box folder (including subfolders) once
        all_sha256: dict[str, str] = {}
        for item in _collect_box_files(client, t.box_id):
            context.log.info(f"Downloading {item.name} from Box")
            stream = client.downloads.download_file(item.id)
            content = stream.read()
            (local_dir / item.name).write_bytes(content)
            all_sha256[item.name] = hashlib.sha256(content).hexdigest()

        context.log.info(f"Downloaded {len(all_sha256)} files from Box")

        mode_count = 0
        all_mappings: dict[str, list] = {}

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
                    mapping_entries.append({"name": local_file.name, "mapping": _mode_mapping(t, src)})

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
            all_mappings[src.mode] = mapping_entries
            mode_count += 1

    finally:
        shutil.rmtree(local_dir, ignore_errors=True)

    return MaterializeResult(metadata={
        "box_id": MetadataValue.text(t.box_id),
        "bucket": MetadataValue.text(S3_BUCKET),
        "modes_uploaded": MetadataValue.int(mode_count),
        "files_downloaded": MetadataValue.int(len(all_sha256)),
        "mappings": MetadataValue.json(all_mappings),
    })


def run_landing(context: AssetExecutionContext, t: SoundclassificationTerritory) -> MaterializeResult:
    """Download soundclassification files from S3 and ingest into per-mode raw tables."""
    total = {"files_downloaded": 0, "files_ingested": 0, "files_skipped": 0}

    for src in t.sources:
        path = s3_prefix(t.dept, t.campaign, src.mode)
        result = s3_landing(context=context, path=path, db_table=src.db_table, dept=t.dept)
        for key in total:
            if key in result.metadata:
                total[key] += result.metadata[key].value

    return MaterializeResult(metadata={
        "files_downloaded": MetadataValue.int(total["files_downloaded"]),
        "files_ingested": MetadataValue.int(total["files_ingested"]),
        "files_skipped": MetadataValue.int(total["files_skipped"]),
    })
