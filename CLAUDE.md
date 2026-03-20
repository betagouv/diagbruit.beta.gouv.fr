# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

Diagbruit is a full-stack geospatial web application for noise impact diagnostics on buildings. It is a **monorepo** with five independent components, each deployable separately.

```
Raw GeoData (shapefiles, GeoJSON)
    → ingestion/ (GeoPandas → PostgreSQL raw_* tables)
    → dbt/       (SQL transforms: raw_* → public schema)
    → fastapi/   (API: geometry intersection + scoring + recommendations)
    → frontend/  (React map: parcel selection → diagnostic results)
    → cms/       (Strapi: recommendation content management)
```

All components share a single **PostgreSQL 15 + PostGIS 3.3** database. The `public_workspace` schema holds raw ingested data; the `public` schema holds dbt-transformed tables consumed by the API.

## Local Setup

```bash
# Start the database
docker-compose up -d

# Create all Python virtual environments
./setup-dev.sh

# Configure dbt profiles
./setup-dbt.sh
```

Local ports: frontend `:3000`, fastapi `:8000`, cms `:1337`, database `:5433`.
Default DB credentials: `user` / `password` / `diagbruit`.

## CI Pipeline

`.github/workflows/ci.yml` runs on PRs and pushes to `main`/`preprod`:
1. Ingestion: installs deps → runs `launch-ingestion.sh` (populates `raw_*` tables)
2. dbt: installs deps → copies `profiles.yml.example` → `dbt run`
3. FastAPI: installs deps → `pytest --cov=app tests/`

A PostGIS service container is available throughout the pipeline.

## Deployment (Scalingo via GitHub Actions)

Deployments are automated via GitHub Actions (`.github/workflows/deploy-*.yml`). Each component auto-deploys to Scalingo when its files change:
- Push to `main` → deploys to production
- Push to `preprod` → deploys to preprod

Path filters ensure only the affected component is deployed (e.g. changes in `fastapi/**` trigger only the FastAPI deployment).

## Component CLAUDE.md Files

Each component has its own `CLAUDE.md` with commands and architecture details:
- `frontend/CLAUDE.md`
- `fastapi/CLAUDE.md`
- `dbt/CLAUDE.md`
- `ingestion/CLAUDE.md`
