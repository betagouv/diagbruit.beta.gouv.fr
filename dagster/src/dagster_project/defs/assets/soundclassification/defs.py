from dagster import AllPartitionMapping, AssetDep, AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.defs.assets.soundclassification._factory import (
    GROUP,
    SOUNDCLASS_BY_DEPT,
    SOUNDCLASS_PARTITIONS,
    launch_from_box,
    run_landing,
)

from dagster_project.defs.resources.box import BoxResource


@asset(
    name="soundclassification_launcher",
    partitions_def=SOUNDCLASS_PARTITIONS,
    group_name=GROUP,
    kinds={"box", "s3"},
)
def soundclassification_launcher(context: AssetExecutionContext, box: BoxResource):
    """Upload soundclassification shapefiles from Box to S3 (one dept per partition)."""
    t = SOUNDCLASS_BY_DEPT[context.partition_key]
    return launch_from_box(context, t, box)


@asset(
    name="soundclassification_landing",
    partitions_def=SOUNDCLASS_PARTITIONS,
    group_name=GROUP,
    kinds={"s3", "postgres"},
    deps=["soundclassification_launcher"],
)
def soundclassification_landing(context: AssetExecutionContext):
    """Download soundclassification files from S3 and ingest into per-mode raw tables."""
    t = SOUNDCLASS_BY_DEPT[context.partition_key]
    return run_landing(context, t)

_LANDING_DEP = AssetDep("soundclassification_landing", partition_mapping=AllPartitionMapping())


@asset(
    group_name="soundclassification",
    key="raw_soundclassification_tramway",
    deps=[_LANDING_DEP],
)
def raw_soundclassification_tramway(context: AssetExecutionContext):
    context.log.info("raw_soundclassification_tramway fan-in: all upstream partitions ready")
    return MaterializeResult(metadata={"status": MetadataValue.text("ok")})

@asset(
    group_name="soundclassification",
    key="raw_soundclassification_fer",
    deps=[_LANDING_DEP],
)
def raw_soundclassification_fer(context: AssetExecutionContext):
    context.log.info("raw_soundclassification_fer fan-in: all upstream partitions ready")
    return MaterializeResult(metadata={"status": MetadataValue.text("ok")})

@asset(
    group_name="soundclassification",
    key="raw_soundclassification_routier",
    deps=[_LANDING_DEP],
)
def raw_soundclassification_routier(context: AssetExecutionContext):
    context.log.info("raw_soundclassification_routier fan-in: all upstream partitions ready")
    return MaterializeResult(metadata={"status": MetadataValue.text("ok")})

@asset(
    group_name="soundclassification",
    key="raw_soundclassification_lgv",
    deps=[_LANDING_DEP],
)
def raw_soundclassification_lgv(context: AssetExecutionContext):
    context.log.info("raw_soundclassification_lgv fan-in: all upstream partitions ready")
    return MaterializeResult(metadata={"status": MetadataValue.text("ok")})