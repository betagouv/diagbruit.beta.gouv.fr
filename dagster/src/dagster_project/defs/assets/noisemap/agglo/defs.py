from dagster import AssetExecutionContext, asset

from dagster_project.defs.assets.noisemap._io import box_to_s3_launcher, ingest_from_s3_landing
from dagster_project.defs.assets.noisemap._partitions import AGGLO_PARTITIONS
from dagster_project.defs.assets.noisemap.agglo._factory import (
    AGGLO_BY_DEPT,
    GROUP,
    KIND,
    SOURCE,
    build_territory_mapping,
    s3_prefix,
)
from dagster_project.defs.resources.box import BoxResource


@asset(
    name="agglo_launcher",
    partitions_def=AGGLO_PARTITIONS,
    group_name=GROUP,
    tags={"stage": "launcher", "source": SOURCE},
    kinds={"box", "s3"},
)
def agglo_launcher(context: AssetExecutionContext, box: BoxResource):
    """Upload agglo files from Box to S3 (one dept per partition)."""
    t = AGGLO_BY_DEPT[context.partition_key]
    return box_to_s3_launcher(
        context=context,
        path=s3_prefix(t),
        type=KIND,
        dept=t.dept,
        box=box,
        folder_id=t.box_folder_id,
        mapping=build_territory_mapping(t),
    )


@asset(
    name="agglo_landing",
    partitions_def=AGGLO_PARTITIONS,
    group_name=GROUP,
    tags={"stage": "landing", "source": SOURCE},
    kinds={"s3", "postgres"},
    deps=["agglo_launcher"],
)
def agglo_landing(context: AssetExecutionContext):
    """Download agglo files from S3 and ingest into public_workspace.raw_noisemap."""
    t = AGGLO_BY_DEPT[context.partition_key]
    return ingest_from_s3_landing(context, path=s3_prefix(t), type=KIND, dept=t.dept, producer_kind="AGGLO")
