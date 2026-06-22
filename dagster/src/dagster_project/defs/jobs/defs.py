"""Job definitions.

These are convenience handles for launching individual ingest scopes from the
Dagster UI. End-to-end relaunches/resets (ingestion + dbt, by domain and dept)
go through `run_pipelines.py`, which selects assets dynamically and owns the dbt
step — so there are intentionally no per-domain "ingest + dbt" jobs here.

Naming convention: `<scope>_ingest_job` ingests one scope (launcher + landing),
`full_<stage>_job` cross-cuts a stage across every domain, and
`ci_landing_by_codedept_job` is the landing-only job CI runs.

Noisemap ingest is split per source type (`agglo_ingest_job`, `infra_ingest_job`,
`fastline_ingest_job`). All partitioned assets share `ALL_DEPT_PARTITIONS` and
skip departments absent from their own registry, so a dept that doesn't apply to
a scope is a no-op, not an error.
"""

from dagster import AssetSelection, define_asset_job

from dagster_project.defs.assets._partitions import ALL_DEPT_PARTITIONS

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

# Landing-only (no launchers): reads S3 into PostGIS + the committed reference
# fixtures, so CI provisions every dbt source table with AWS creds and no Box.
_CI_LANDING_ASSETS = [
    "agglo_landing",
    "infra_landing",
    "fastline_landing",
    "soundclassification_landing",
    "bdnb_landing",
    "raw_peb",
    "raw_full_osm_foods_data",
    "raw_full_osm_schools_data",
    "raw_full_osm_terrasses",
    "geo_departements",
    "raw_noisemap",
    "raw_noisezone",
    "raw_soundclassification_tramway",
    "raw_soundclassification_fer",
    "raw_soundclassification_routier",
    "raw_soundclassification_lgv",
    "raw_bdnb",
]
ci_landing_by_codedept_job = define_asset_job(
    "ci_landing_by_codedept_job",
    selection=AssetSelection.assets(*_CI_LANDING_ASSETS),
    partitions_def=ALL_DEPT_PARTITIONS,
    tags={"domain": "ci", "scope": "landing"},
)