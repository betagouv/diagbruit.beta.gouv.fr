from dagster import AssetExecutionContext, AssetsDefinition, asset

from dagster_project.defs.assets.noisemap._io import box_to_s3_launcher, ingest_from_s3_landing
from dagster_project.defs.assets.noisemap.infra_fastlines._registry import FastlineTerritory
from dagster_project.defs.resources.box import BoxResource

GROUP = "noisemap_fastline"
SOURCE = "box"
KIND = "fastline"


def _s3_prefix(t: FastlineTerritory) -> str:
    return f"noisemap/cbs_infra_fastlines/dept={t.dept}/campaign={t.campaign}/"


def build_fastline_assets(t: FastlineTerritory) -> tuple[AssetsDefinition, AssetsDefinition]:
    prefix = _s3_prefix(t)
    launcher_key = f"{KIND}_{t.dept}_launcher"
    landing_key = f"{KIND}_{t.dept}_landing"
    base_tags = {"dept": t.dept, "source": SOURCE}

    @asset(
        name=launcher_key,
        group_name=GROUP,
        tags={**base_tags, "stage": "launcher"},
        kinds={"box", "s3"},
    )
    def _launcher(context: AssetExecutionContext, box: BoxResource):
        f"""Upload {KIND} {t.dept} files from Box to S3."""
        return box_to_s3_launcher(
            context=context,
            path=prefix,
            type=KIND,
            dept=t.dept,
            box=box,
            folder_id=t.box_folder_id,
        )

    @asset(
        name=landing_key,
        group_name=GROUP,
        tags={**base_tags, "stage": "landing"},
        kinds={"s3", "postgres"},
        deps=[launcher_key],
    )
    def _landing(context: AssetExecutionContext):
        f"""Download {KIND} {t.dept} files from S3 into public_workspace.raw_noisemap."""
        return ingest_from_s3_landing(context, path=prefix, type=KIND, dept=t.dept)

    return _launcher, _landing
