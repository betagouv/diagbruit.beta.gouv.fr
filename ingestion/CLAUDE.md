# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
source ../ingestion-venv/bin/activate
cd ingestion

./launch-ingestion.sh          # run full ingestion pipeline

# Run a single ingestion manually
python ingest_shapefiles.py inputs/path/to/file.shp table_name --schema public_workspace --if-exists replace
python ingest_geojson.py inputs/path/to/file.geojson table_name --schema public_workspace --if-exists replace
```

## Environment Variables

Copy `.env.example` to `.env`: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

## Architecture

**Two ingestion scripts:**
- `ingest_shapefiles.py` — reads shapefiles via GeoPandas, supports `--ignore-column`, column renaming, drops Z-coordinates
- `ingest_geojson.py` — reads GeoJSON via GeoPandas; if CRS is missing, defaults to EPSG:4326; supports `--if-exists skip` to avoid re-ingesting

Both write to the `public_workspace` schema as `raw_*` tables, which are the sources for dbt staging models.

**`launch-ingestion.sh`** orchestrates all ingestion in order:
1. `geo_departements` — department boundaries
2. `raw_noisemap_*` — noise maps (INFRA, AGGLO, FASTLINES variants)
3. `raw_soundclassification_*` — road/rail/tram sound classifications
4. `raw_peb` — protected zone data
5. `raw_topo` — BDNB building data (downloaded from S3 if missing)
6. `raw_full_stras_data` — Strasbourg licensed terraces (GeoJSON)
7. `raw_full_osm_data` — OSM food service POIs for Bordeaux & Strasbourg (GeoJSON)

**Order matters:** Strasbourg data (`raw_full_stras_data`) must be ingested before OSM data (`raw_full_osm_data`) to match the dbt pipeline dependency.

## Adding New Data Sources

1. Place the file in `inputs/<domain>/`
2. Add an entry to the appropriate `FILES_*` array in `launch-ingestion.sh`
3. Use `run_ingest` for shapefiles, `run_ingest_geojson` for GeoJSON
4. Use `--if-exists replace` for reference data that should be refreshed, `--if-exists skip` for data loaded once
