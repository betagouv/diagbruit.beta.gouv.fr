"""Job definitions.

Naming convention: `<domain>_[<scope>_]job` where
  - <domain>  = noisemap | osm | peb | strasbourg | soundclassification | full
  - <scope>   = optional: `ingest` (ingest assets only, no dbt), `launcher`,
                `landing`, or a department code (033, 044, ...)
  - bare `<domain>_job` = the whole domain, dbt included.

Selections lean on tags (`dept`, `stage`, `source`) and groups so that adding a
new territory only requires a registry entry — never a new job definition.
"""

from dagster import AssetSelection, define_asset_job

from dagster_project.defs.assets.noisemap.agglo._registry import AGGLO_TERRITORIES
from dagster_project.defs.assets.noisemap.infra._registry import INFRA_TERRITORIES

# Unified noisemap dept list: every dept present in agglo OR infra gets a job.
# When infra_fastlines gains a registry, merge it in here too.
NOISEMAP_DEPTS: tuple[str, ...] = tuple(
    sorted({t.dept for t in AGGLO_TERRITORIES} | {t.dept for t in INFRA_TERRITORIES})
)

NOISEMAP_INGEST_GROUPS = ("noisemap_agglo", "noisemap_infra", "noisemap_fastline")
_STAGE_INGEST = AssetSelection.tag("stage", "launcher") | AssetSelection.tag(
    "stage", "landing"
)

# ── Stage cross-cuts (across every domain) ────────────────────────────────
full_launcher_job = define_asset_job(
    "full_launcher_job",
    selection=AssetSelection.tag("stage", "launcher"),
    tags={"domain": "full", "scope": "launcher"},
)
full_landing_job = define_asset_job(
    "full_landing_job",
    selection=AssetSelection.tag("stage", "landing"),
    tags={"domain": "full", "scope": "landing"},
)

# ── Per-domain ingest-only (S3 + Postgres landing, no dbt) ────────────────
noisemap_ingest_job = define_asset_job(
    "noisemap_ingest_job",
    selection=AssetSelection.groups(*NOISEMAP_INGEST_GROUPS),
    tags={"domain": "noisemap", "scope": "ingest"},
)
osm_ingest_job = define_asset_job(
    "osm_ingest_job",
    selection=AssetSelection.groups("osm") & _STAGE_INGEST,
    tags={"domain": "osm", "scope": "ingest"},
)
peb_ingest_job = define_asset_job(
    "peb_ingest_job",
    selection=AssetSelection.groups("peb") & _STAGE_INGEST,
    tags={"domain": "peb", "scope": "ingest"},
)
soundclassification_ingest_job = define_asset_job(
    "soundclassification_ingest_job",
    selection=AssetSelection.groups("soundclassification") & _STAGE_INGEST,
    tags={"domain": "soundclassification", "scope": "ingest"},
)

# ── Per-domain "everything" (ingest + dbt) ────────────────────────────────
noisemap_job = define_asset_job(
    "noisemap_job",
    selection=AssetSelection.assets("noisemap").upstream(),
    tags={"domain": "noisemap", "scope": "pipeline"},
)
osm_job = define_asset_job(
    "osm_job",
    selection=AssetSelection.assets("noisesource").upstream(),
    tags={"domain": "osm", "scope": "pipeline"},
)
peb_job = define_asset_job(
    "peb_job",
    selection=AssetSelection.assets("peb").upstream(),
    tags={"domain": "peb", "scope": "pipeline"},
)
strasbourg_job = define_asset_job(
    "strasbourg_job",
    selection=AssetSelection.groups("strasbourg").downstream(),
    tags={"domain": "strasbourg", "scope": "pipeline"},
)

# ── Per-dept noisemap ingest (auto-generated from NOISEMAP_DEPTS) ─────────
for _dept in NOISEMAP_DEPTS:
    _name = f"noisemap_{_dept}_job"
    globals()[_name] = define_asset_job(
        _name,
        selection=AssetSelection.groups(*NOISEMAP_INGEST_GROUPS)
        & AssetSelection.tag("dept", _dept),
        tags={"domain": "noisemap", "scope": "dept", "dept": _dept},
    )

# ── Everything everywhere ─────────────────────────────────────────────────
full_pipeline_job = define_asset_job(
    "full_pipeline_job",
    selection=AssetSelection.all(),
    tags={"domain": "full", "scope": "pipeline"},
)
