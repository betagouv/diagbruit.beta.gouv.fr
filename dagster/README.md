# dagster_project

Dagster orchestrator for the **Diagbruit** data pipeline. It ingests geospatial noise-map data from external sources (data.gouv.fr, Box, OSM) into S3, then lands it into a PostgreSQL/PostGIS database consumed by the dbt and FastAPI components.

## Architecture

```
External sources
  ├─ data.gouv.fr (ZIP shapefiles)   → s3_launcher        → S3 _source/
  ├─ Box (shapefiles, subfolders)    → box_to_s3_launcher  → S3 _source/
  └─ OSM APIs (GeoJSON / ZIP)        → osm_*_launcher      → S3 _source/
                                              ↓
                                    S3 mapping.json + manifest.json
                                              ↓
                              s3_landing / ingest_from_s3_landing
                                              ↓
                          public_workspace.raw_noisemap (PostGIS)
                          public_workspace.raw_soundclassification_*
                          public_workspace.raw_full_osm_*
```

Every pipeline follows a **launcher → landing** pattern:
- **launcher**: downloads source files, uploads them to S3 under `<path>_source/`, writes a `mapping.json` (column mapping per shapefile) and a `manifest.json` (provenance + SHA-256 checksums).
- **landing**: reads `mapping.json` from S3, downloads source files back, and ingests each shapefile into PostGIS via `ingest_shapefile`.

---

## Asset groups

Assets are grouped by **domain**. The launcher → landing stage is carried on a
`stage` tag (not a group), which is what `full_launcher_job` / `full_landing_job`
select on. Per-dept assets are partitioned and all share `ALL_DEPT_PARTITIONS`
(see `defs/assets/_partitions.py`).

| Group | Assets (launcher → landing) | Partitioned | Source | S3 prefix |
|---|---|---|---|---|
| `noisemap_agglo` | `agglo_launcher` → `agglo_landing` | by dept | Box | `noisemap/cbs_agglo/territory={slug}/campaign={campaign}/` |
| `noisemap_infra` | `infra_launcher` → `infra_landing` | by dept | data.gouv.fr | `noisemap/cbs_infra/dept={dept}/campaign={campaign}/` |
| `noisemap_fastline` | `fastline_launcher` → `fastline_landing` | by dept | Box | `noisemap/cbs_infra_fastlines/dept={dept}/campaign={campaign}/` |
| `noisemap` | `raw_noisemap` (fan-in sentinel) | no | — | — |
| `soundclassification` | `soundclassification_launcher` → `soundclassification_landing` | by dept | Box | `soundclassification/dept={dept}/campaign={campaign}/mode={mode}/` |
| `soundclassification` | `raw_soundclassification_{tramway,fer,routier,lgv}` (fan-in markers) | no | — | — |
| `osm` | `osm_foods_launcher` → `raw_full_osm_foods_data`; `osm_schools_launcher` → `raw_full_osm_schools_data`; `terrasses_launcher` → `raw_full_osm_terrasses` | no | data.gouv.fr / Box | `noisesource/osm/{foods,schools,terrasses}/` |
| `peb` | `peb_launcher` → `raw_peb` | no | data.gouv.fr | `peb/scope={scope}/` |
| `maintenance` | `box_token_refresh` | no | — | — |

**Partition depts** (all on the shared `ALL_DEPT_PARTITIONS` axis):
- `noisemap_agglo` / `noisemap_infra` / `noisemap_fastline`: `013, 033, 035, 044, 059, 067`
- `soundclassification`: adds `019` → `013, 019, 033, 035, 044, 059, 067`

> Because every partitioned asset shares one partition set, the picker offers a
> dept even for a scope that has no territory for it (e.g. `019` for agglo).
> Materializing such a partition raises `KeyError` — the per-dept asset bodies do
> a direct `*_BY_DEPT[context.partition_key]` lookup.

**Landing targets:** noisemap landings (agglo/infra/fastline) all append to
`public_workspace.raw_noisemap`; soundclassification landings write
`public_workspace.raw_soundclassification_<mode>`; osm/peb write their
own `raw_*` tables. The fan-in markers (`raw_noisemap`, `raw_soundclassification_*`)
are unpartitioned no-ops that depend on *all* partitions of their landing assets
(`AllPartitionMapping()`); their keys match the dbt source names.

**Maintenance:** `box_token_refresh` (group `maintenance`) refreshes the Box OAuth
token in the `box_tokens` table; it runs via `box_token_refresh_job`, triggered by
`box_token_refresh_sensor` (~every 50 minutes).

---

## Jobs

These jobs are convenience handles for launching one ingest scope from the
**Dagster UI**. For end-to-end relaunches/resets (ingestion + dbt, by domain and
dept), use [`run_pipelines.py`](#relaunching-pipelines) instead — it selects assets
dynamically and owns the dbt step, so there are no per-domain "ingest + dbt" jobs.

| Job | Selection |
|---|---|
| `full_launcher_job` | every asset tagged `stage=launcher` (all domains) |
| `full_landing_job` | every asset tagged `stage=landing` (all domains) |
| `agglo_ingest_job` | `noisemap_agglo` group (launcher + landing) |
| `infra_ingest_job` | `noisemap_infra` group (launcher + landing) |
| `fastline_ingest_job` | `noisemap_fastline` group (launcher + landing) |
| `osm_ingest_job` | `osm` group, ingest stages only |
| `peb_ingest_job` | `peb` group, ingest stages only |
| `soundclassification_ingest_job` | `soundclassification` group, ingest stages only |
| `ci_landing_by_codedept_job` | landing-only (no launchers): S3 `_source/` → PostGIS for one dept + the committed `departements` fixture. Needs only AWS creds. Run in CI via `python ci_ingest.py ci_landing_by_codedept_job 033` |
| `box_token_refresh_job` | `box_token_refresh` (run by the sensor) |

Run a single named job for one partition from the CLI with
`uv run python run_job.py <job_name> 033`.

---

## Relaunching pipelines

`run_pipelines.py` is the one entrypoint for relaunching ingestion **and** the
matching dbt models, parameterised by two axes — domain and department. Both flags
are **required** (no implicit "everything"), so a full reset must be typed out.

```bash
uv run python run_pipelines.py --domain <DOMAIN> --dept <DEPT> [flags]
```

| | `--domain` | `--dept` |
|---|---|---|
| values | `all`, `noisemap`, `soundclassification`, `bdnb`, `osm`, `peb`, `noisezone`, `departements` | `all`, or a code like `033` |

The four use cases:

```bash
# 1. Relaunch every pipeline, every department (full reset)
uv run python run_pipelines.py --domain all --dept all --full-refresh

# 2. Relaunch one pipeline, every department
uv run python run_pipelines.py --domain noisemap --dept all

# 3. Relaunch all (dept-scoped) pipelines for one department
uv run python run_pipelines.py --domain all --dept 033

# 4. Relaunch one pipeline for one department
uv run python run_pipelines.py --domain noisemap --dept 033
```

**Department semantics.** A department only exists for the dept-scoped domains
(`noisemap`, `soundclassification`, `bdnb`). So `--dept <code>` runs *only* those;
national domains (`osm`, `peb`, `noisezone`, `departements`) are skipped under
`--domain all` and rejected if named directly (`--domain peb --dept 033` errors —
use `--dept all`). A dept absent from a domain's registry is a no-op skip.

**Flags.**

| Flag | Effect |
|---|---|
| `--with-launcher` | also run the Box launcher stage (Box → S3). Default is landing-only (S3 → PostGIS): no Box, reprocesses existing source. |
| `--full-refresh` | pass `--full-refresh` to dbt (drop & recreate). Use after a DB wipe. |
| `--skip-dbt` | ingestion only, no dbt. |
| `--fail-fast` | stop at the first failing unit. Default: continue and report a summary at the end. |
| `--dry-run` | print the plan (units + asset keys + dbt selection) without running anything. |

Multi-unit runs (`--domain all` or `--dept all`) spawn one **subprocess per unit**
for fault isolation, then run the domain-scoped dbt **once**. Runs use the
configured DagsterInstance, so they appear in the Dagster UI. If any ingestion unit
fails, dbt is skipped (fix the units and rerun, or rerun dbt manually).

### On Scalingo (target a specific database)

Both Dagster and dbt read the connection from env vars (`DB_HOST`/`DB_PORT`/
`DB_NAME`/`DB_USER`/`DB_PASSWORD`) — there is no connection string in the command.
A one-off container inherits the app's env; pass `-e` to override/target explicitly:

On Scalingo `uv` is build-only (not on the runtime PATH), so call `python`
directly — the venv is already active and `dbt` is on PATH:

```bash
scalingo --app diag-bruit-dagster --region osc-fr1 run \
  -e DB_HOST=<target> -e DB_PORT=<target> -e DB_NAME=<target> \
  -e DB_USER=<target> -e DB_PASSWORD=<target> \
  --size XL \
  'cd dagster && python run_pipelines.py --domain all --dept all --full-refresh'
```

---

## Resources

### `BoxResource`
Authenticates to Box using OAuth2. The access token is persisted in the `box_tokens` table in PostgreSQL so it survives restarts. Requires the token to be seeded once manually via `box_auth.py`.

### S3
Uses boto3. The bucket and credentials are read from environment variables (see below).

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5433` | PostgreSQL port |
| `DB_NAME` | `diagbruit` | Database name |
| `DB_USER` | `user` | Database user |
| `DB_PASSWORD` | `password` | Database password |
| `AWS_S3_BUCKET` | `diagbruit-dagster` | S3 bucket name |
| `AWS_DEFAULT_REGION` | `eu-west-3` | AWS region |
| `AWS_ACCESS_KEY_ID` | — | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | — | AWS credentials |
| `BOX_CLIENT_ID` | — | Box OAuth app client ID |
| `BOX_CLIENT_SECRET` | — | Box OAuth app client secret |

Copy `.env.example` to `.env` and fill in the values before running.

---

## Setup

**Requires Python 3.10–3.13 and a running PostgreSQL 15 + PostGIS instance.** (dbt's toolchain does not yet support Python 3.14.)

```bash
# Install dependencies
uv sync

# Activate the virtual environment
source .venv/bin/activate   # macOS/Linux
.venv\Scripts\activate    # Windows

# Create the dbt profile (read by the DbtProjectComponent from dagster/dbt/)
cp dbt/profiles.yml.example dbt/profiles.yml   # edit if your DB creds differ

# Seed the Box OAuth token (one-time)
python box_auth.py
```

> The dbt profile lives at `dagster/dbt/profiles.yml` — the Dagster dbt
> component reads it from the project directory, not from `~/.dbt`. It is
> committed and env-templated (defaults to the docker-compose DB, reads `DB_*`
> when set), so no setup step is needed.

---

## Running

```bash
# Start the Dagster UI on port 3001 (avoids conflict with the frontend on 3000)
uv run dagster dev -p 3001
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## Key internals

### `ingest_shapefile`
Located in `src/dagster_project/ingestion/ingest_shapefiles.py`. Reads a shapefile with GeoPandas, reprojects to EPSG:2154, applies a whitelist-based column mapping, and writes to PostGIS using `geometry(Geometry, 2154)` — a generic geometry type that accepts both `Polygon` and `MultiPolygon` without type mismatch errors on append.

Column mapping spec per shapefile entry:
```python
{
  "output_col": True,              # keep source column as-is
  "output_col": {"from": "src"},   # rename src → output_col
  "output_col": {"value": "val"},  # inject a constant value
}
```

### `_box_walk`
Recursive helper in `tools.py` that traverses Box folder trees, downloading every file and uploading it to S3, returning SHA-256 checksums and a list of `.shp` filenames found.