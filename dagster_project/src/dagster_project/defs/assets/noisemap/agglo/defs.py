from dagster_project.defs.assets.noisemap.agglo._factory import build_agglo_assets
from dagster_project.defs.assets.noisemap.agglo._registry import AGGLO_TERRITORIES

for _territory in AGGLO_TERRITORIES:
    _launcher, _landing = build_agglo_assets(_territory)
    globals()[f"agglo_{_territory.dept}_launcher"] = _launcher
    globals()[f"agglo_{_territory.dept}_landing"] = _landing
