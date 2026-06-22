"""Relaunch ingestion pipelines (and their dbt models) by domain and department.

    uv run python run_pipelines.py --domain <DOMAIN> --dept <DEPT> [flags]

Both --domain and --dept are REQUIRED — there is no implicit "everything" default,
so a full reset must be typed out explicitly (`--domain all --dept all`).

Axes
----
--domain   all | noisemap | soundclassification | bdnb | osm | peb | noisezone | departements
--dept     all | <code>   (e.g. 033)

A department only exists for the dept-scoped domains (noisemap, soundclassification,
bdnb). Consequently:
  * `--dept <code>` runs ONLY the dept-scoped domains. National domains are skipped
    under `--domain all`, and naming one directly (e.g. `--domain peb --dept 033`)
    is an error.
  * A `<code>` absent from a domain's partition set is skipped with a log line.

Flags
-----
--with-launcher   also run the Box launcher stage (Box -> S3). Default: landing-only
                  (S3 -> PostGIS), which needs no Box and reprocesses existing source.
--full-refresh    pass --full-refresh to dbt (drop & recreate). Use after a wipe.
--skip-dbt        ingestion only, no dbt.
--fail-fast       stop at the first failing unit. Default: continue and report at end.
--dry-run         print the plan (units + asset keys + dbt selection) without running.

Mechanics
---------
The runner selects assets by `group + stage tag` and materialises them through the
implicit global asset job (`asset_selection`), one partition at a time. For multi-unit
runs (`--domain all` or `--dept all`) it spawns one subprocess per unit (fault
isolation), then runs the domain-scoped dbt once. Runs use the configured
DagsterInstance, so they appear in the Dagster UI (like run_job.py).

The target database is selected purely by env vars (DB_HOST/DB_PORT/DB_NAME/DB_USER/
DB_PASSWORD) — on Scalingo, pass them with `-e` on the one-off `scalingo run`.
See dagster/README.md "Relaunching pipelines" for the full guide.
"""

import argparse
import subprocess
import sys
from pathlib import Path

from dagster import DagsterInstance

import dagster_project.definitions as definitions_module

_DAGSTER_DIR = Path(__file__).resolve().parent

# Logical domain -> Dagster asset group(s). noisemap fans out to its three scopes,
# each carrying its own dept partition set.
DOMAIN_GROUPS = {
    "noisemap": ["noisemap_agglo", "noisemap_infra", "noisemap_fastline"],
    "soundclassification": ["soundclassification"],
    "bdnb": ["bdnb"],
    "osm": ["osm"],
    "peb": ["peb"],
    "noisezone": ["noisezone"],
    "departements": ["departements"],
}
PARTITIONED_DOMAINS = {"noisemap", "soundclassification", "bdnb"}
NATIONAL_DOMAINS = {"osm", "peb", "noisezone", "departements"}
ALL_DOMAINS = list(DOMAIN_GROUPS)

# Logical domain -> dbt selector. None = no dbt models (source only).
DOMAIN_DBT_SELECT = {
    "noisemap": "noisemap",
    "soundclassification": "soundclassification",
    "bdnb": "bdnb",
    "osm": "osm",
    "peb": "peb",
    "noisezone": "noisezone",
    "departements": None,
}


def _load_defs():
    d = definitions_module.defs
    return d() if callable(d) else d


def _domain_landing_assets(defs, domain, stages):
    """[(AssetKey, partitions_def_or_None)] for `domain` whose stage tag is in `stages`."""
    groups = set(DOMAIN_GROUPS[domain])
    graph = defs.resolve_asset_graph()
    out = []
    for key in graph.get_all_asset_keys():
        node = graph.get(key)
        tags = getattr(node, "tags", None) or {}
        if getattr(node, "group_name", None) in groups and tags.get("stage") in stages:
            out.append((key, getattr(node, "partitions_def", None)))
    return out


def _domain_partition_keys(defs, domain):
    keys = set()
    for _key, pdef in _domain_landing_assets(defs, domain, {"landing"}):
        if pdef is not None:
            keys.update(pdef.get_partition_keys())
    return sorted(keys)


def _stages(with_launcher):
    return {"landing", "launcher"} if with_launcher else {"landing"}


# ── leaf execution: one domain, one unit ──────────────────────────────────────
def run_leaf(defs, domain, dept, with_launcher, dry_run):
    assets = _domain_landing_assets(defs, domain, _stages(with_launcher))
    if not assets:
        print(f"  [skip] domain '{domain}': no matching assets")
        return True

    if domain in PARTITIONED_DOMAINS:
        selection = [k for k, pdef in assets if pdef is not None and dept in pdef.get_partition_keys()]
        if not selection:
            print(f"  [skip] '{domain}' has no '{dept}' partition")
            return True
        partition_key = dept
    else:
        selection = [k for k, _pdef in assets]
        partition_key = None

    label = f"{domain} [{dept}]" + (" +launcher" if with_launcher else "")
    if dry_run:
        print(f"  [dry-run] {label}: " + ", ".join(k.to_user_string() for k in selection))
        return True

    print(f"→ materialising {label} ({len(selection)} assets)…")
    job = defs.resolve_implicit_global_asset_job_def()
    result = job.execute_in_process(
        asset_selection=selection,
        partition_key=partition_key,
        instance=DagsterInstance.get(),
        raise_on_error=False,
    )
    if not result.success:
        print(f"❌ {label} failed:")
        for event in result.get_step_failure_events():
            err = getattr(event.event_specific_data, "error", None)
            print(f"  • {event.step_key}: {err.to_string() if err else '<no error info>'}")
    return result.success


# ── orchestration: expand to units and spawn one subprocess each ──────────────
def plan_units(defs, domain, dept):
    """Return [(domain, child_dept)] for a multi-unit run, logging skips."""
    domains = ALL_DOMAINS if domain == "all" else [domain]
    units = []
    for d in domains:
        if d in PARTITIONED_DOMAINS:
            if dept == "all":
                units.extend((d, k) for k in _domain_partition_keys(defs, d))
            else:
                units.append((d, dept))
        else:  # national
            if dept == "all":
                units.append((d, "all"))
            else:
                print(f"  [skip] national domain '{d}' (dept-scoped run --dept {dept})")
    return units


def spawn(domain, dept, args):
    cmd = [sys.executable, str(Path(__file__).name), "--domain", domain, "--dept", dept, "--skip-dbt"]
    if args.with_launcher:
        cmd.append("--with-launcher")
    if args.fail_fast:
        cmd.append("--fail-fast")
    if args.dry_run:
        cmd.append("--dry-run")
    print(f"→ {domain} [{dept}]")
    return subprocess.run(cmd, cwd=_DAGSTER_DIR).returncode == 0


# ── dbt ───────────────────────────────────────────────────────────────────────
def run_dbt(domains, full_refresh, dry_run):
    selects = [DOMAIN_DBT_SELECT[d] for d in domains if DOMAIN_DBT_SELECT.get(d)]
    if not selects:
        print("dbt: nothing to build for the selected domain(s); skipping")
        return True
    cmd = ["dbt", "run", "--project-dir", "dbt", "--profiles-dir", "dbt", "--select", *sorted(set(selects))]
    if full_refresh:
        cmd.append("--full-refresh")
    if dry_run:
        print(f"  [dry-run] dbt: {' '.join(cmd)}")
        return True
    print(f"→ dbt: {' '.join(cmd)}")
    return subprocess.run(cmd, cwd=_DAGSTER_DIR).returncode == 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Relaunch ingestion pipelines by domain and department.")
    parser.add_argument("--domain", required=True, choices=["all", *ALL_DOMAINS])
    parser.add_argument("--dept", required=True, help="'all' or a department code (e.g. 033)")
    parser.add_argument("--with-launcher", action="store_true", help="also run the Box launcher stage")
    parser.add_argument("--full-refresh", action="store_true", help="pass --full-refresh to dbt")
    parser.add_argument("--skip-dbt", action="store_true", help="ingestion only, no dbt")
    parser.add_argument("--fail-fast", action="store_true", help="stop at the first failing unit")
    parser.add_argument("--dry-run", action="store_true", help="print the plan without running")
    args = parser.parse_args()

    if args.domain in NATIONAL_DOMAINS and args.dept != "all":
        parser.error(
            f"'{args.domain}' is a national (non-dept) domain — use '--dept all' "
            f"(or pick a dept-scoped domain: {', '.join(sorted(PARTITIONED_DOMAINS))})"
        )

    defs = _load_defs()

    # A leaf = single domain, single unit (concrete dept if partitioned, else national).
    is_leaf = args.domain != "all" and (
        args.domain in NATIONAL_DOMAINS or args.dept != "all"
    )

    if is_leaf:
        ok = run_leaf(defs, args.domain, args.dept, args.with_launcher, args.dry_run)
        domains_run = [args.domain]
    else:
        units = plan_units(defs, args.domain, args.dept)
        if not units:
            print("Nothing to run for this domain/dept combination.")
            return 0
        results = []
        for d, dp in units:
            success = spawn(d, dp, args)
            results.append((d, dp, success))
            if not success and args.fail_fast:
                print("⛔ --fail-fast: stopping after first failure")
                break
        failed = [(d, dp) for d, dp, s in results if not s]
        print("\n── ingestion summary ─────────────────────────")
        print(f"  units: {len(results)}   ok: {len(results) - len(failed)}   failed: {len(failed)}")
        for d, dp in failed:
            print(f"  ❌ {d} [{dp}]")
        ok = not failed
        domains_run = sorted({d for d, _dp, _s in results})

    if args.skip_dbt:
        return 0 if ok else 1

    if not ok:
        print("\n⚠️  ingestion had failures — skipping dbt. Fix the units above and rerun,")
        print("   or rerun dbt manually once raw_* is complete.")
        return 1

    dbt_ok = run_dbt(domains_run, args.full_refresh, args.dry_run)
    return 0 if dbt_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
