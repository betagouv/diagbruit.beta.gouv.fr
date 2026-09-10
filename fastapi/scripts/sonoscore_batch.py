"""Produce frozen sonoscores for every parcel of a department.

    python scripts/sonoscore_batch.py --dept 033 [--workers 4] [--communes 33063]

Runs on the FastAPI app, which is the only Scalingo app shipping the scoring code
(the Dagster app is deployed from `git subtree push --prefix dagster`, so `app.*`
does not exist there). Moving this into a Dagster asset means first extracting the
algorithm into a package both components can install.

    scalingo --app diag-bruit-api --region osc-fr1 run --size M \\
        -e DATABASE_URL=postgresql://…@replica…/… \\
        python scripts/sonoscore_batch.py --dept 033 --workers 2

`DATABASE_URL` is read from, and written to unless `SONOSCORE_OUTPUT_DATABASE_URL`
points somewhere else. A `postgres://` URL, which is what Scalingo prints, is
accepted and rewritten.

Deliberately thin: it reads parcel geometries, hands each one to the *existing* query
functions from `app.utils.db`, then to `get_parcelle_diagnostic`, and stores the
score. No SQL and no scoring logic is reimplemented here, so an algorithm change
needs no change in this file.

Only noisemap and PEB are queried. They are the sole inputs of the score — the other
three sources feed descriptive fields we do not store, and each would add a Strapi
HTTP round-trip per parcel. Swap in `_generate_diagnostic_threaded` from
`app.routes.diag` if a full diagnostic is ever needed.
"""

import argparse
import os
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import datetime, timezone
from time import perf_counter

from sqlalchemy import create_engine, text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _normalise_pg_url(url):
    """Scalingo hands out `postgres://`, which SQLAlchemy 2 dropped in favour of
    `postgresql://`. Rewritten in the environment rather than at engine creation
    because app/database.py builds its engine at import time, below."""
    return "postgresql://" + url[len("postgres://"):] if url.startswith("postgres://") else url


for _var in ("DATABASE_URL", "SONOSCORE_OUTPUT_DATABASE_URL"):
    if os.environ.get(_var):
        os.environ[_var] = _normalise_pg_url(os.environ[_var])

from app.algorithm import get_parcelle_diagnostic  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.utils.db import (  # noqa: E402
    query_noisemap_intersecting_features,
    query_peb_intersecting_features,
)
from app.utils.geometry import get_area_m2_from_wkt  # noqa: E402

ALGO_VERSION = os.getenv("SONOSCORE_ALGO_VERSION", "poc-1")
# Scores can be written somewhere other than the geodata they are computed from —
# a scratch database for a measurement run, say. Defaults to the read database.
OUTPUT_DATABASE_URL = os.getenv("SONOSCORE_OUTPUT_DATABASE_URL") or os.environ["DATABASE_URL"]

DDL = """
CREATE TABLE IF NOT EXISTS public.sonoscore (
    idu           text        NOT NULL,
    code_insee    text        NOT NULL,
    codedept      text        NOT NULL,
    score         smallint    NOT NULL,
    has_data      boolean     NOT NULL,
    algo_version  text        NOT NULL,
    computed_at   timestamptz NOT NULL,
    PRIMARY KEY (idu, algo_version)
);
CREATE INDEX IF NOT EXISTS idx_sonoscore_code_insee ON public.sonoscore (code_insee);
CREATE INDEX IF NOT EXISTS idx_sonoscore_codedept   ON public.sonoscore (codedept);
"""

# ST_Multi matches what the API receives: the frontend posts parcel coordinates that
# create_multipolygon_from_coordinates turns into a MULTIPOLYGON before any query.
PARCELLES_SQL = """
-- 17 decimals, not ST_AsText's default 15: 15 drops the last bits of the float64
-- coordinates, and on a handful of parcels the rounded polygon makes ST_Difference
-- produce a residue whose spherical area PostGIS refuses to compute
-- ("lwgeom_area_spher(oid) returned area < 0.0"). Sanitising the residue afterwards
-- does not help — ST_MakeValid, ST_ForcePolygonCCW and ST_Buffer(_, 0) all still
-- raise. Not rounding in the first place does.
SELECT idu, ST_AsText(ST_Multi(geometry), 17) AS wkt
FROM public.parcelle
WHERE code_insee = :code_insee
ORDER BY idu
"""

INSERT_SQL = """
INSERT INTO public.sonoscore
    (idu, code_insee, codedept, score, has_data, algo_version, computed_at)
VALUES (:idu, :code_insee, :codedept, :score, :has_data, :algo_version, :computed_at)
ON CONFLICT (idu, algo_version) DO UPDATE
   SET score = EXCLUDED.score,
       has_data = EXCLUDED.has_data,
       computed_at = EXCLUDED.computed_at
"""


class Populate:
    """Stand-in for the Pydantic model the API passes; only the flags are read.

    zones=True is not optional: it is the variant the public site serves, and it
    gates the "noise stopped by buildings" re-scoring in get_parcelle_diagnostic.
    """

    def __init__(self, zones=True, isolation=False):
        self.zones = zones
        self.isolation = isolation


def score_parcelle(db, wkt, codedept, populate):
    noisemap = query_noisemap_intersecting_features(db, wkt, codedept)
    peb = query_peb_intersecting_features(db, wkt)

    diagnostic = get_parcelle_diagnostic(
        noisemap.get("intersections", []),
        [],
        peb.get("intersections", []),
        [],
        [],
        noisemap.get("percent_unimpacted", 0),
        populate,
        get_area_m2_from_wkt(wkt),
    )
    has_data = bool(noisemap.get("intersections") or peb.get("intersections"))
    return diagnostic["score"], has_data


def process_commune(code_insee, codedept):
    """Score every parcel of one commune.

    Returns (code_insee, n, n_with_data, n_failed, seconds, sample_error).
    """
    started = perf_counter()
    populate = Populate()
    db = SessionLocal()
    now = datetime.now(timezone.utc)
    rows = []
    failed = []

    try:
        parcelles = db.execute(text(PARCELLES_SQL), {"code_insee": code_insee}).all()
        for parcelle in parcelles:
            try:
                score, has_data = score_parcelle(db, parcelle.wkt, codedept, populate)
            except Exception as error:
                # Left out of sonoscore, so a later run retries it.
                db.rollback()
                failed.append((parcelle.idu, f"{type(error).__name__}: {error}"))
                continue
            rows.append({
                "idu": parcelle.idu, "code_insee": code_insee, "codedept": codedept,
                "score": score, "has_data": has_data,
                "algo_version": ALGO_VERSION, "computed_at": now,
            })
    finally:
        db.close()

    # Its own short-lived engine: the writes may target another database, and a
    # process-pool worker must not inherit a parent's connection.
    out = create_engine(OUTPUT_DATABASE_URL, pool_size=1, max_overflow=0)
    try:
        with out.begin() as conn:
            for start in range(0, len(rows), 5000):
                conn.execute(text(INSERT_SQL), rows[start:start + 5000])
    finally:
        out.dispose()

    sample = failed[0][1][:200] if failed else None
    return (code_insee, len(rows), sum(r["has_data"] for r in rows),
            len(failed), perf_counter() - started, sample)


def main():
    parser = argparse.ArgumentParser(description="Produce frozen sonoscores for a department.")
    parser.add_argument("--dept", required=True, help="3-char code, e.g. 033")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--communes", help="comma-separated INSEE codes; default: every commune of the dept")
    parser.add_argument("--skip-done", action="store_true",
                        help="skip communes already scored for this algo_version (resume a long run)")
    args = parser.parse_args()

    out = create_engine(OUTPUT_DATABASE_URL)
    with out.begin() as conn:
        conn.execute(text(DDL))
        done = set()
        if args.skip_done:
            done = {r[0] for r in conn.execute(text(
                "SELECT code_insee FROM public.sonoscore "
                "WHERE codedept = :d AND algo_version = :v GROUP BY code_insee"),
                {"d": args.dept, "v": ALGO_VERSION})}
    out.dispose()

    engine = create_engine(os.environ["DATABASE_URL"])
    with engine.connect() as conn:
        if args.communes:
            communes = args.communes.split(",")
        else:
            # Biggest communes first: Bordeaux alone holds 63k of the 033's 2M parcels,
            # so any other order ends with one worker on it while the rest idle.
            communes = [r[0] for r in conn.execute(text(
                "SELECT code_insee FROM public.parcelle WHERE codedept = :d "
                "GROUP BY code_insee ORDER BY count(*) DESC"), {"d": args.dept})]
    engine.dispose()

    if done:
        skipped = len([c for c in communes if c in done])
        communes = [c for c in communes if c not in done]
        print(f"{skipped} communes déjà calculées, ignorées")

    print(f"{len(communes)} communes, {args.workers} workers, algo_version={ALGO_VERSION}")
    started = perf_counter()
    total = with_data = 0

    failed_total = 0
    crashed = []

    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(process_commune, c, args.dept): c for c in communes}
        for done, future in enumerate(as_completed(futures), 1):
            commune = futures[future]
            try:
                code_insee, n, n_data, n_failed, seconds, sample = future.result()
            except Exception as error:
                # A dead worker must not abort the 500 remaining communes; --skip-done
                # picks this one back up on the next run.
                crashed.append(commune)
                print(f"[{done}/{len(communes)}] {commune}: ÉCHEC — {error}", flush=True)
                continue
            total += n
            with_data += n_data
            failed_total += n_failed
            rate = n / seconds if seconds else 0
            suffix = f", {n_failed} en erreur ({sample})" if n_failed else ""
            print(f"[{done}/{len(communes)}] {code_insee}: {n} parcelles, "
                  f"{n_data} avec données, {seconds:.1f}s ({rate:.0f}/s){suffix}", flush=True)

    elapsed = perf_counter() - started
    print(f"\n{total} parcelles ({with_data} avec données) en {elapsed:.0f}s "
          f"— {total / elapsed:.1f} parcelles/s avec {args.workers} workers")
    if failed_total or crashed:
        print(f"{failed_total} parcelles en erreur, {len(crashed)} communes échouées "
              f"{crashed[:10]} — relancer avec --skip-done")


if __name__ == "__main__":
    main()
