from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.defs.assets.noisemap._io import box_to_s3_launcher, ingest_from_s3_landing, rename_fastline
from dagster_project.defs.assets.noisemap._partitions import FASTLINE_PARTITIONS
from dagster_project.defs.assets.noisemap.infra_fastlines._registry import (
    FASTLINE_TERRITORIES,
    FastlineFile,
    FastlineTerritory,
)
from dagster_project.defs.resources.box import BoxResource

GROUP = "noisemap_fastline"
SOURCE = "box"
KIND = "fastline"

FASTLINE_BY_DEPT = {t.dept: t for t in FASTLINE_TERRITORIES}


def _s3_prefix(dept: str, campaign: str) -> str:
    return f"noisemap/cbs_infra_fastlines/dept={dept}/campaign={campaign}/"


def _file_mapping(t: FastlineTerritory, f: FastlineFile) -> dict:
    return {
        "geometry": True,
        "codedept": {"value": t.dept},
        "label": {"value": ""},
        "campaign": {"value": t.campaign},
        "acoustic_producer_kind": {"value": "INFRA"},
        "noisemap_pipeline": {"value": "FASTLINE"},
        "kind": {"value": f.typesource},
        "acoustic_noisemap_kind": {"value": f.cbstype},
        "acoustic_db_value": {"from": t.db_value_from},
        "acoustic_time_range": {"value": f.indicetype},
    }


def _build_file_mapping(t: FastlineTerritory) -> list[dict]:
    return [{"name": f.name, "mapping": _file_mapping(t, f)} for f in t.files]


@asset(
    name="fastline_launcher",
    partitions_def=FASTLINE_PARTITIONS,
    group_name=GROUP,
    tags={"stage": "launcher", "source": SOURCE},
    kinds={"box", "s3"},
)
def fastline_launcher(context: AssetExecutionContext, box: BoxResource):
    """Upload fastline files from Box to S3 (one dept per partition)."""
    t = FASTLINE_BY_DEPT.get(context.partition_key)
    if t is None:
        return MaterializeResult(metadata={"status": MetadataValue.text(
            f"skipped: no fastline territory for dept {context.partition_key}")})
    if t.is_infra:
        return box_to_s3_launcher(
            context=context,
            path=_s3_prefix(t.dept, t.campaign),
            type=KIND,
            dept=t.dept,
            box=box,
            folder_id=t.box_folder_id,
            callback=rename_fastline,
        )
    return box_to_s3_launcher(
        context=context,
        path=_s3_prefix(t.dept, t.campaign),
        type=KIND,
        dept=t.dept,
        box=box,
        folder_id=t.box_folder_id,
        mapping=_build_file_mapping(t),
    )


@asset(
    name="fastline_landing",
    partitions_def=FASTLINE_PARTITIONS,
    group_name=GROUP,
    tags={"stage": "landing", "source": SOURCE},
    kinds={"s3", "postgres"},
    deps=["fastline_launcher"],
)
def fastline_landing(context: AssetExecutionContext):
    """Download fastline files from S3 and ingest into public_workspace.raw_noisemap."""
    t = FASTLINE_BY_DEPT.get(context.partition_key)
    if t is None:
        return MaterializeResult(metadata={"status": MetadataValue.text(
            f"skipped: no fastline territory for dept {context.partition_key}")})
    return ingest_from_s3_landing(context, path=_s3_prefix(t.dept, t.campaign), type=KIND, dept=t.dept, noisemap_pipeline="FASTLINE")
