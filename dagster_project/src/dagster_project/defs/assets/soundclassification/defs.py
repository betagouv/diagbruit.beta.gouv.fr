from dagster import AssetExecutionContext, asset

from dagster_project.defs.assets.soundclassification._factory import (
    GROUP,
    SOUNDCLASS_BY_DEPT,
    SOUNDCLASS_PARTITIONS,
    launch_from_box,
    run_landing,
)
from dagster_project.defs.resources.box import BoxResource


@asset(
    name="soundclass_launcher",
    partitions_def=SOUNDCLASS_PARTITIONS,
    group_name=GROUP,
    kinds={"box", "s3"},
)
def soundclass_launcher(context: AssetExecutionContext, box: BoxResource):
    """Upload soundclassification shapefiles from Box to S3 (one dept per partition)."""
    t = SOUNDCLASS_BY_DEPT[context.partition_key]
    return launch_from_box(context, t, box)


@asset(
    name="soundclass_landing",
    partitions_def=SOUNDCLASS_PARTITIONS,
    group_name=GROUP,
    kinds={"s3", "postgres"},
    deps=["soundclass_launcher"],
)
def soundclass_landing(context: AssetExecutionContext):
    """Download soundclassification files from S3 and ingest into per-mode raw tables."""
    t = SOUNDCLASS_BY_DEPT[context.partition_key]
    return run_landing(context, t)
