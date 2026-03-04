# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
source ../fastapi-venv/bin/activate

# Run development server
uvicorn app.main:app --reload                # :8000

# Run tests
pytest                                        # all tests
pytest tests/unit/                            # unit tests only
pytest tests/integration/                     # integration tests only
pytest tests/path/to/test_file.py::test_name # single test
pytest --cov=app tests/                       # with coverage
```

## Environment Variables

Copy `.env.example` to `.env`:
- `DATABASE_URL` — PostgreSQL connection string (PostGIS required)
- `STRAPI_URL` — CMS base URL for fetching recommendation content
- `METABASE_SECRET_KEY` — JWT signing key for Metabase embedding

## Architecture

**Stack:** FastAPI, SQLAlchemy 2, GeoAlchemy2, Shapely, Pydantic v1.

**Entry point:** `app/main.py` — mounts routers, sets up CORS, initialises SQLAlchemy models.

**Routers:**
- `app/routes/diag.py` — `POST /diag/generate`: core diagnostic endpoint. Takes a GeoJSON geometry, intersects it against PostGIS tables (noisemap, soundclassification, peb, topo, noisesource), computes noise scores, fetches recommendations from Strapi.
- `app/routes/metabase.py` — generates signed Metabase iframe URLs.

**Database layer:** SQLAlchemy models in `app/models/`. Geometry columns use GeoAlchemy2. Raw spatial queries are in `app/utils/` — prefer Shapely/GeoAlchemy2 over raw ST_* SQL where possible.

**Test layout:**
- `tests/unit/` — pure Python, no DB (score calculation logic)
- `tests/integration/` — requires a live PostGIS DB with dbt tables populated

**pytest config:** `pytest.ini` sets `pythonpath = .` so `from app.xxx import ...` works from the repo root.
