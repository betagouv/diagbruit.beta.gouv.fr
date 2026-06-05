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

### `launcher`
| Asset | Source | Dept | S3 path |
|---|---|---|---|
| `infra_033_launcher` | data.gouv.fr | 033 | `noisemap/cbs_infra/dept=033/campaign=2022/` |
| `infra_044_launcher` | data.gouv.fr | 044 | `noisemap/cbs_infra/dept=044/campaign=2022/` |
| `agglo_033_launcher` | Box | 033 | `noisemap/cbs_agglo/territory=bordeaux-metropole/campaign=2022/` |
| `agglo_044_launcher` | Box | 044 | `noisemap/cbs_agglo/territory=nantes-metropole/campaign=2022/` |
| `agglo_067_launcher` | Box | 067 | `noisemap/cbs_agglo/territory=strasbourg-metropole/campaign=2022/` |
| `fastline_033_launcher` | Box | 033 | `noisemap/cbs_infra_fastlines/dept=033/campaign=2022/` |
| `fastline_044_launcher` | Box | 044 | `noisemap/cbs_infra_fastlines/dept=044/campaign=2022/` |
| `soundclass_033_launcher` | Local files | 033 | `soundclassification/dept=033/campaign=2022/mode=*/` |
| `soundclass_044_launcher` | data.gouv.fr | 044 | `soundclassification/dept=044/campaign=2022/mode=*/` |
| `osm_foods_launcher` | OSM API | — | `noisesource/osm/foods/` |
| `osm_schools_launcher` | data.gouv.fr | — | `noisesource/osm/schools/` |

### `landing`
Each launcher has a corresponding landing asset that ingests into PostgreSQL. Noisemap landings all append to `public_workspace.raw_noisemap`. Sound classification landings go to `public_workspace.raw_soundclassification_<mode>`.

### `noisemap`
| Asset | Role |
|---|---|
| `raw_noisemap` | Sentinel asset that depends on all noisemap landing assets. Materializing it triggers the full noisemap ingestion. |

### `maintenance`
| Asset | Role |
|---|---|
| `box_token_refresh` | Refreshes the Box OAuth token stored in the `box_tokens` database table. Triggered automatically by `box_token_refresh_sensor` every ~50 minutes. |

---

## Jobs

| Job | Description |
|---|---|
| `full_launcher_job` | All assets in the `launcher` group |
| `full_landing_job` | All assets in the `landing` group |
| `raw_noisemap_job` | Full noisemap pipeline: all launchers + landings + `raw_noisemap` sentinel |
| `full_noisemap_job` | Full pipeline including downstream dbt models |
| `dept_033` | Launcher + landing for dept 033 agglo + infra |
| `osm_full_job` | OSM foods launcher + landing |
| `peb_job` | PEB launcher + landing |

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
| `AWS_S3_BUCKET` | `diagbruit` | S3 bucket name |
| `AWS_DEFAULT_REGION` | `eu-west-3` | AWS region |
| `AWS_ACCESS_KEY_ID` | — | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | — | AWS credentials |
| `BOX_CLIENT_ID` | — | Box OAuth app client ID |
| `BOX_CLIENT_SECRET` | — | Box OAuth app client secret |

Copy `.env.example` to `.env` and fill in the values before running.

---

## Setup

**Requires Python 3.10–3.14 and a running PostgreSQL 15 + PostGIS instance.**

```bash
# Install dependencies
uv sync

# Activate the virtual environment
source .venv/bin/activate   # macOS/Linux
.venv\Scripts\activate    # Windows

# Seed the Box OAuth token (one-time)
python box_auth.py
```

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