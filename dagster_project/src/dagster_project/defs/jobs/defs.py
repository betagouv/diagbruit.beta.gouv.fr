"""Job definitions.

Naming convention: `<domain>_[<scope>_]job` where
  - <domain>  = noisemap | osm | peb | strasbourg | soundclassification | full
  - <scope>   = optional: `ingest` (ingest assets only, no dbt), `launcher`,
                `landing`, or a noisemap source-type (`agglo`, `infra`,
                `fastline`).
  - bare `<domain>_job` = the whole domain, dbt included.

Noisemap ingest is split per source type (`agglo_ingest_job`, `infra_ingest_job`,
`fastline_ingest_job`) because each source has its own dept partition set. To
ingest "all noisemap data for dept 033" run the three jobs with partition 033,
or select the relevant assets directly from the Assets page.
"""

from dagster import AssetSelection, define_asset_job

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

# ── Noisemap per-source ingest (each its own dept partition set) ──────────
agglo_ingest_job = define_asset_job(
    "agglo_ingest_job",
    selection=AssetSelection.groups("noisemap_agglo"),
    tags={"domain": "noisemap", "scope": "agglo"},
)
infra_ingest_job = define_asset_job(
    "infra_ingest_job",
    selection=AssetSelection.groups("noisemap_infra"),
    tags={"domain": "noisemap", "scope": "infra"},
)
fastline_ingest_job = define_asset_job(
    "fastline_ingest_job",
    selection=AssetSelection.groups("noisemap_fastline"),
    tags={"domain": "noisemap", "scope": "fastline"},
)

# ── Other per-domain ingest-only ──────────────────────────────────────────
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
# noisemap_job spans the 3 source-type partition defs + unpartitioned dbt.
# Dagster handles this by treating each partitioned asset on its own axis at
# launch time. For a focused single-source run use the per-source ingest jobs.
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
