from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.defs.assets.noisemap._io import box_to_s3_launcher, ingest_from_s3_landing  # s3_launcher used by commented-out infra_launcher
from dagster_project.defs.assets.noisemap._partitions import INFRA_PARTITIONS
from dagster_project.defs.assets.noisemap.infra._registry import INFRA_TERRITORIES
from dagster_project.defs.resources.box import BoxResource

GROUP = "noisemap_infra"
KIND = "infra"

INFRA_BY_DEPT = {t.dept: t for t in INFRA_TERRITORIES}


def _s3_prefix(dept: str, campaign: str) -> str:
    return f"noisemap/cbs_infra/dept={dept}/campaign={campaign}/"


# @asset(
#     name="infra_launcher",
#     partitions_def=INFRA_PARTITIONS,
#     group_name=GROUP,
#     tags={"stage": "launcher", "source": "data.gouv"},
#     kinds={"s3"},
# )
# def infra_launcher(context: AssetExecutionContext):
#     """Download infra ZIPs from data.gouv.fr, extract, upload to S3 (one dept per partition)."""
#     t = INFRA_BY_DEPT.get(context.partition_key)
#     if t is None:
#         return MaterializeResult(metadata={"status": MetadataValue.text(
#             f"skipped: no infra territory for dept {context.partition_key}")})
#     return s3_launcher(context=context, path=_s3_prefix(t.dept, t.campaign), arr_url=[t.url])


@asset(
    name="infra_launcher_box",
    partitions_def=INFRA_PARTITIONS,
    group_name=GROUP,
    tags={"stage": "launcher", "source": "box"},
    kinds={"box", "s3"},
)
def infra_launcher_box(context: AssetExecutionContext, box: BoxResource):
    """Upload infra files from Box to S3 (one dept per partition). Temporary replacement for infra_launcher."""
    t = INFRA_BY_DEPT.get(context.partition_key)
    if t is None:
        return MaterializeResult(metadata={"status": MetadataValue.text(
            f"skipped: no infra territory for dept {context.partition_key}")})
    if not t.box_folder_id:
        return MaterializeResult(metadata={"status": MetadataValue.text(
            f"skipped: no box_folder_id configured for dept {context.partition_key}")})
    return box_to_s3_launcher(
        context=context,
        path=_s3_prefix(t.dept, t.campaign),
        type=KIND,
        dept=t.dept,
        box=box,
        folder_id=t.box_folder_id,
    )


@asset(
    name="infra_landing",
    partitions_def=INFRA_PARTITIONS,
    group_name=GROUP,
    tags={"stage": "landing", "source": "box"},
    kinds={"s3", "postgres"},
    deps=["infra_launcher_box"],
)
def infra_landing(context: AssetExecutionContext):
    """Download infra files from S3 and ingest into public_workspace.raw_noisemap."""
    t = INFRA_BY_DEPT.get(context.partition_key)
    if t is None:
        return MaterializeResult(metadata={"status": MetadataValue.text(
            f"skipped: no infra territory for dept {context.partition_key}")})
    return ingest_from_s3_landing(
        context=context,
        path=_s3_prefix(t.dept, t.campaign),
        type=KIND,
        dept=t.dept,
        noisemap_pipeline="INFRA",
    )
