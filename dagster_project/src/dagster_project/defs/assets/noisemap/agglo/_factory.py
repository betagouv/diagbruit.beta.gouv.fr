from dagster import AssetExecutionContext, AssetsDefinition, asset

from dagster_project.defs.assets.noisemap.agglo._registry import AggloFile, AggloTerritory
from dagster_project.defs.assets.noisemap._io import box_to_s3_launcher, ingest_from_s3_landing
from dagster_project.defs.resources.box import BoxResource


KIND = "agglo"


def _s3_prefix(t: AggloTerritory) -> str:
    return f"noisemap/cbs_{KIND}/territory={t.slug}/campaign={t.campaign}/"


def _file_mapping(t: AggloTerritory, f: AggloFile) -> dict:
    mapping = {
        "id": True,
        "geometry": True,
        "legende": {"from": t.legende_from},
        "typesource": {"value": f.typesource},
        "cbstype": {"value": f.cbstype},
        "indicetype": {"value": f.indicetype},
        "annee": {"value": t.annee},
        "codedept": {"value": t.dept},
        "typeterr": {"value": "AGGLO"},
        "codeinfra": {"value": ""},
        "idcbs": {"value": ""},
        "producteur": {"value": ""},
        "zonedef": {"value": ""},
        "validedeb": {"value": ""},
        "validefin": {"value": ""},
    }
    if f.keep_source:
        mapping["source"] = True
    return mapping


def _build_territory_mapping(t: AggloTerritory) -> list[dict]:
    return [{"name": f.name, "mapping": _file_mapping(t, f)} for f in t.files]


def build_agglo_assets(t: AggloTerritory) -> tuple[AssetsDefinition, AssetsDefinition]:
    prefix = _s3_prefix(t)
    mapping = _build_territory_mapping(t)
    launcher_key = f"{KIND}_{t.dept}_launcher"
    landing_key = f"{KIND}_{t.dept}_landing"

    @asset(name=launcher_key, group_name="launcher")
    def _launcher(context: AssetExecutionContext, box: BoxResource):
        f"""Upload {KIND} {t.dept} ({t.slug}) files from Box to S3."""
        return box_to_s3_launcher(
            context=context,
            path=prefix,
            type=KIND,
            dept=t.dept,
            box=box,
            folder_id=t.box_folder_id,
            mapping=mapping,
        )

    @asset(name=landing_key, group_name="landing", deps=[launcher_key])
    def _landing(context: AssetExecutionContext):
        f"""Download {KIND} {t.dept} ({t.slug}) files from S3 into public_workspace.raw_noisemap."""
        return ingest_from_s3_landing(context, path=prefix, type=KIND, dept=t.dept)

    return _launcher, _landing
