from dagster_project.defs.assets.noisemap.infra_fastlines._factory import build_fastline_assets
from dagster_project.defs.assets.noisemap.infra_fastlines._registry import FASTLINE_TERRITORIES

for _territory in FASTLINE_TERRITORIES:
    _launcher, _landing = build_fastline_assets(_territory)
    globals()[f"fastline_{_territory.dept}_launcher"] = _launcher
    globals()[f"fastline_{_territory.dept}_landing"] = _landing
