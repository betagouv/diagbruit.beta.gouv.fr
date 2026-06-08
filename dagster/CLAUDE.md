# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This component is the **Dagster orchestrator**: it ingests geospatial source data into PostGIS and runs the dbt transforms. The dbt project lives in `dagster/dbt/` (see `dagster/dbt/CLAUDE.md`).

## Commands

Run everything from the `dagster/` folder. Dependencies are managed with `uv` (not pip/requirements.txt).

```bash
uv sync                                              # install deps into .venv
uv run python box_auth.py                            # seed Box OAuth token (one-time)
uv run dagster dev -p 3001                           # Dagster UI on :3001 (avoids frontend :3000)

# Launch a job from the CLI (dg = dagster-dg-cli)
uv run dg launch --job dev_pipeline_033_job --partition 033
```

## Environment Variables

Copy `.env.example` to `.env`. Key vars: `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` (PostGIS),
`AWS_S3_BUCKET/AWS_DEFAULT_REGION/AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY` (S3),
`BOX_CLIENT_ID/BOX_CLIENT_SECRET` (Box OAuth). Full table in `README.md`.

## Architecture

**Stack:** Dagster 1.13, dagster-dbt, GeoPandas, boto3. Python ≥3.10,<3.15.

**Package layout** — importable package stays `src/dagster_project/` (named to avoid colliding
with the `dagster` library import; the *folder* is `dagster/`):
- `defs/assets/` — assets grouped by domain: `noisemap/{agglo,infra,infra_fastlines}`, `soundclassification`, `osm`, `peb`, `bdnb`, `strasbourg`, `departements`.
- `defs/jobs/`, `defs/resources/` (`box.py` → `BoxResource`), `defs/schedules/` (`box_refresh.py` → `box_token_refresh_sensor`).
- `ingestion/` — Dagster-agnostic GeoPandas → PostGIS ingest (`ingest_shapefiles.py`, `ingest_geojson.py`).
- `reference_data/` — committed static fixtures (`departments/depts.shp`, strasbourg GeoJSON) ingested directly by the `departements` / `strasbourg` assets (no launcher).
- `io/` — shared helpers; `DAGSTER_ROOT` (resolved from `__file__`), S3 client, DB URL.
- `ci_ingest.py` (repo `dagster/` root) — runs an asset job to completion **in-process** (`execute_in_process`) and exits non-zero on failure; used by CI to provision the test DB. The `dg launch` / `dagster asset materialize` CLIs submit asynchronously and don't block, so they're unsuitable for CI.

**Ingest pattern:** every source follows **launcher → landing**. The launcher uploads source files to
S3 (`<path>_source/`) with a `mapping.json` (per-shapefile column map) + `manifest.json` (provenance +
SHA-256); the landing reads the mapping back and ingests each shapefile into `public_workspace.raw_*`.

**Per-dept assets** are generated from a `_registry.py` (territory list) via a `_factory.py`. Asset
bodies look up the territory by partition key, e.g. `AGGLO_BY_DEPT[context.partition_key]` — a direct
dict lookup, so a partition with no matching registry entry raises `KeyError`.

**Partitions:** all partitioned assets share `ALL_DEPT_PARTITIONS` (union of every dept across scopes,
in `defs/assets/_partitions.py`) so a single `--partition <dept>` applies across a cross-scope job.
Trade-off: the picker offers depts a given scope can't materialize — see the `KeyError` note above.

**Fan-in markers:** unpartitioned no-op assets (`raw_noisemap`, `raw_soundclassification_*`) depend on
all partitions of their landing assets (`AllPartitionMapping()`); they signal downstream dbt that per-dept
ingest is complete. Their keys match the dbt source names.

**Jobs** (`defs/jobs/defs.py`): per-scope ingest (`agglo_ingest_job`, `infra_ingest_job`,
`fastline_ingest_job`, `osm_ingest_job`, `peb_ingest_job`, `soundclassification_ingest_job`),
stage jobs (`full_launcher_job`, `full_landing_job`), domain pipelines (`noisemap_job`, `osm_job`,
`peb_job`, `strasbourg_job`), `dev_pipeline_033_job` (cross-domain local end-to-end for dept 033,
includes Box launchers), and `ci_landing_033_job` (landing-only: S3 → PostGIS + committed fixtures, no
Box — what CI runs via `ci_ingest.py`).

See `README.md` for the full asset/source/S3-path catalog and ingest internals.
