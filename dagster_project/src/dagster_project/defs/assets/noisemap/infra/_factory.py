from dagster import AssetExecutionContext, AssetsDefinition, asset

from dagster_project.defs.assets.noisemap._io import s3_landing, s3_launcher
from dagster_project.defs.assets.noisemap.infra._registry import InfraTerritory

GROUP = "noisemap_infra"
SOURCE = "data.gouv"


def _s3_prefix(t: InfraTerritory) -> str:
    return f"noisemap/cbs_infra/dept={t.dept}/campaign={t.campaign}/"


def build_infra_assets(t: InfraTerritory) -> tuple[AssetsDefinition, AssetsDefinition]:
    prefix = _s3_prefix(t)
    launcher_key = f"infra_{t.dept}_launcher"
    landing_key = f"infra_{t.dept}_landing"
    base_tags = {"dept": t.dept, "source": SOURCE}

    @asset(
        name=launcher_key,
        group_name=GROUP,
        tags={**base_tags, "stage": "launcher"},
        kinds={"s3"},
    )
    def _launcher(context: AssetExecutionContext):
        f"""Download infra {t.dept} ZIPs from data.gouv.fr, extract, upload to S3."""
        return s3_launcher(context=context, path=prefix, arr_url=[t.url])

    @asset(
        name=landing_key,
        group_name=GROUP,
        tags={**base_tags, "stage": "landing"},
        kinds={"s3", "postgres"},
        deps=[launcher_key],
    )
    def _landing(context: AssetExecutionContext):
        f"""Download infra {t.dept} files from S3 and ingest into public_workspace.raw_noisemap."""
        return s3_landing(context=context, path=prefix, db_table="raw_noisemap")

    return _launcher, _landing
