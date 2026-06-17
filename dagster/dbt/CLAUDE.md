# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

dbt is managed by the dagster `uv` environment (dbt 1.11) — no separate venv. Run from `dagster/`:

```bash
uv run dbt debug --project-dir dbt --profiles-dir dbt   # verify DB connection
uv run dbt run   --project-dir dbt --profiles-dir dbt   # run all models
uv run dbt run   --project-dir dbt --profiles-dir dbt --select osm          # one domain
uv run dbt run   --project-dir dbt --profiles-dir dbt --select noisesource  # one model
uv run dbt test  --project-dir dbt --profiles-dir dbt   # schema tests
uv run dbt run   --project-dir dbt --profiles-dir dbt --full-refresh        # recreate tables
```

Profile is read from `dagster/dbt/profiles.yml` (the dbt project dir, where Dagster's dbt component looks — not `~/.dbt`). It is committed and env-templated: it defaults to the docker-compose DB and reads `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` when set.

## Model Structure

Models follow the standard dbt layered architecture under `models/<domain>/`:

| Layer | Materialization | Purpose |
|-------|----------------|---------|
| `staging/` | view | Rename/cast columns from raw source tables (`public_workspace.raw_*`) |
| `intermediate/` | view (schema: `workspace`) | Business logic, joins, filtering, deduplication |
| `marts/` | table | Final output tables consumed by FastAPI |

**Domains:** `noisemap`, `soundclassification`, `peb`, `bdnb`, `osm` (foods, schools, terrasses)

## Key Pipeline: OSM → noisesource

The `noisesource` table (final mart in `osm/`) aggregates noise-emitting establishments:

```
stg_terrasses → int_terrasses_slug ┐ (dedup reference, per codedept)
stg_foods → int_foods_filter → int_foods_validate → int_foods_slug
stg_schools → int_schools_filter → int_schools_dep → int_schools_slug
                                    ↓
                              noisesource (UNION ALL of int_terrasses_slug + int_foods_slug + int_schools_slug)
```

**Rule:** `int_terrasses_slug` must be built before any foods intermediate model — dbt enforces this via the `{{ ref('int_terrasses_slug') }}` dependency in `int_foods_validate`.

Foods deduplication (`int_foods_validate`) uses `pg_trgm` similarity + `ST_DWithin` to exclude foods establishments already present in the terrasses data, matched per department (`codedept`). Both extensions are created on-run-start in `dbt_project.yml`.

## Extensions Required

The following PostgreSQL extensions are created automatically at the start of each dbt run:
- `unaccent` — used in name normalisation regexes
- `pg_trgm` — used for `similarity()` in deduplication
