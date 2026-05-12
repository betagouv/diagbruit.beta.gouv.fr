from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.defs.assets.noisemap.agglo._registry import AGGLO_TERRITORIES
from dagster_project.defs.assets.noisemap.infra._registry import INFRA_TERRITORIES
from dagster_project.defs.assets.noisemap.infra_fastlines._registry import FASTLINE_TERRITORIES

RAW_NOISEMAP_DEPS = [
    *[f"agglo_{t.dept}_landing" for t in AGGLO_TERRITORIES],
    *[f"infra_{t.dept}_landing" for t in INFRA_TERRITORIES],
    *[f"fastline_{t.dept}_landing" for t in FASTLINE_TERRITORIES],
]

@asset(
    group_name="noisemap",
    key="raw_noisemap",
    deps=RAW_NOISEMAP_DEPS,
)
def raw_noisemap(context: AssetExecutionContext):
    context.log.info("All noisemap landings complete")
    return MaterializeResult(metadata={"status": MetadataValue.text("ok")})