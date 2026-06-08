from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.defs.assets.noisemap._io import s3_landing, s3_launcher
from dagster_project.defs.assets.noisemap._partitions import INFRA_PARTITIONS
from dagster_project.defs.assets.noisemap.infra._registry import INFRA_TERRITORIES

GROUP = "noisemap_infra"
SOURCE = "data.gouv"

INFRA_BY_DEPT = {t.dept: t for t in INFRA_TERRITORIES}


def _s3_prefix(dept: str, campaign: str) -> str:
    return f"noisemap/cbs_infra/dept={dept}/campaign={campaign}/"


@asset(
    name="infra_launcher",
    partitions_def=INFRA_PARTITIONS,
    group_name=GROUP,
    tags={"stage": "launcher", "source": SOURCE},
    kinds={"s3"},
)
def infra_launcher(context: AssetExecutionContext):
    """Download infra ZIPs from data.gouv.fr, extract, upload to S3 (one dept per partition)."""
    t = INFRA_BY_DEPT.get(context.partition_key)
    if t is None:
        return MaterializeResult(metadata={"status": MetadataValue.text(
            f"skipped: no infra territory for dept {context.partition_key}")})
    return s3_launcher(context=context, path=_s3_prefix(t.dept, t.campaign), arr_url=[t.url])


@asset(
    name="infra_landing",
    partitions_def=INFRA_PARTITIONS,
    group_name=GROUP,
    tags={"stage": "landing", "source": SOURCE},
    kinds={"s3", "postgres"},
    deps=["infra_launcher"],
)
def infra_landing(context: AssetExecutionContext):
    """Download infra files from S3 and ingest into public_workspace.raw_noisemap."""
    t = INFRA_BY_DEPT.get(context.partition_key)
    if t is None:
        return MaterializeResult(metadata={"status": MetadataValue.text(
            f"skipped: no infra territory for dept {context.partition_key}")})
    return s3_landing(
        context=context,
        path=_s3_prefix(t.dept, t.campaign),
        db_table="raw_noisemap",
        dept=t.dept,
    )
