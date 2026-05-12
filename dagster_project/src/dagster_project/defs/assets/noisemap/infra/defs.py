from dagster_project.defs.assets.noisemap.infra._factory import build_infra_assets
from dagster_project.defs.assets.noisemap.infra._registry import INFRA_TERRITORIES

for _territory in INFRA_TERRITORIES:
    _launcher, _landing = build_infra_assets(_territory)
    globals()[f"infra_{_territory.dept}_launcher"] = _launcher
    globals()[f"infra_{_territory.dept}_landing"] = _landing
