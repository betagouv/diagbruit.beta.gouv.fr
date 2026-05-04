from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

RAW_NOISEMAP_DEPS = [
    "agglo_033_landing",
    "infra_033_landing",
    "infra_044_landing",
]

@asset(
    group_name="noisemap",
    key="raw_noisemap",
    deps=RAW_NOISEMAP_DEPS,
)
def raw_noisemap(context: AssetExecutionContext):
    context.log.info("All noisemap landings complete")
    return MaterializeResult(metadata={"status": MetadataValue.text("ok")})