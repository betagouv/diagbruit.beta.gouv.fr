# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
source ../dbt-venv/bin/activate
cd dbt

dbt debug                          # verify DB connection
dbt run                            # run all models
dbt run --select osm               # run a single domain
dbt run --select noisesource       # run a single model
dbt test                           # run schema tests
dbt run --full-refresh             # force recreate tables
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
