from dagster import AssetExecutionContext, asset

from dagster_project.defs.assets.noisemap._io import box_to_s3_launcher, ingest_from_s3_landing
from dagster_project.defs.assets.noisemap._partitions import FASTLINE_PARTITIONS
from dagster_project.defs.assets.noisemap.infra_fastlines._registry import FASTLINE_TERRITORIES
from dagster_project.defs.resources.box import BoxResource

GROUP = "noisemap_fastline"
SOURCE = "box"
KIND = "fastline"

FASTLINE_BY_DEPT = {t.dept: t for t in FASTLINE_TERRITORIES}


def _s3_prefix(dept: str, campaign: str) -> str:
    return f"noisemap/cbs_infra_fastlines/dept={dept}/campaign={campaign}/"


@asset(
    name="fastline_launcher",
    partitions_def=FASTLINE_PARTITIONS,
    group_name=GROUP,
    tags={"stage": "launcher", "source": SOURCE},
    kinds={"box", "s3"},
)
def fastline_launcher(context: AssetExecutionContext, box: BoxResource):
    """Upload fastline files from Box to S3 (one dept per partition)."""
    t = FASTLINE_BY_DEPT[context.partition_key]
    return box_to_s3_launcher(
        context=context,
        path=_s3_prefix(t.dept, t.campaign),
        type=KIND,
        dept=t.dept,
        box=box,
        folder_id=t.box_folder_id,
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
    t = FASTLINE_BY_DEPT[context.partition_key]
    return ingest_from_s3_landing(context, path=_s3_prefix(t.dept, t.campaign), type=KIND, dept=t.dept)
