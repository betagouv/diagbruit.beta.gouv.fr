from dagster import (
    AllPartitionMapping,
    AssetDep,
    AssetExecutionContext,
    MaterializeResult,
    MetadataValue,
    asset,
)


# raw_noisemap is unpartitioned and waits for ALL partitions of each
# partitioned upstream. Made explicit (rather than relying on Dagster's
# implicit default) so the intent survives Dagster version upgrades.
RAW_NOISEMAP_DEPS = [
    AssetDep("agglo_landing", partition_mapping=AllPartitionMapping()),
    AssetDep("infra_landing", partition_mapping=AllPartitionMapping()),
    AssetDep("fastline_landing", partition_mapping=AllPartitionMapping()),
]


@asset(
    group_name="noisemap",
    key="raw_noisemap",
    deps=RAW_NOISEMAP_DEPS,
)
def raw_noisemap(context: AssetExecutionContext):
    """Fan-in marker. Materialized after every partition of every upstream landing.

    No-op asset: signals downstream dbt that all per-dept ingest is complete.
    """
    context.log.info("raw_noisemap fan-in: all upstream partitions ready")
    return MaterializeResult(metadata={"status": MetadataValue.text("ok")})
