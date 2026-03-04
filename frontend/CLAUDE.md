# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn start        # Dev server on :3000
yarn build        # Production build
yarn test         # Run tests (React Testing Library + Jest)
yarn test --watchAll=false  # Single test run (CI mode)
```

Package manager: **yarn** (v4, not npm).

## Environment Variables

Copy `.env.example` to `.env`. Key variables:
- `REACT_APP_API_URL` — FastAPI backend URL
- `REACT_APP_CMS_URL` — Strapi CMS URL
- `REACT_APP_ENVIRONMENT` — controls dev/prod behaviour

## Architecture

**Stack:** React 19, TypeScript, React Router 7, react-scripts (CRA).

**UI kit:** `@codegouvfr/react-dsfr` (French government DSFR design system) + Material UI 7.

**Map:** MapLibre GL + `react-map-gl`. Geospatial calculations client-side via **Turf.js**.

**Key flow — diagnostic:**
1. User selects a parcel on the map (MapLibre layer click)
2. Frontend POSTs the parcel geometry to `POST /diag/generate` (FastAPI)
3. API returns noise scores, PEB zones, and recommendations
4. Results displayed as coloured map layers + summary cards

**Routing:** React Router v7 with pages in `src/pages/` (home, diagnostic, stats, cms-page).

**HTTP:** Axios. All API calls are centralised — look for `axios` instances/interceptors before adding new calls.

**Forms:** React Hook Form + Zod for validation.

## Docker

Multi-stage Dockerfile: Node 18 build → nginx:stable-alpine serve.
The `REACT_APP_API_URL` build-arg must be passed at build time (baked into the static bundle).
