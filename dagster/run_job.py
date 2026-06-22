"""Run a Dagster job to completion, in-process, against the configured instance.

    uv run python run_job.py <job_name> [partition_key]

Unlike ci_ingest.py (which uses an ephemeral instance), this records the run to
the DAGSTER_HOME-configured storage (the metadata Postgres addon) so it appears
in the web UI. Blocks until the run finishes and exits non-zero on failure, so
it is safe to invoke from a one-off `scalingo run` container:

    scalingo --app diag-bruit-dagster run \
        -e DB_HOST=<target> -e DB_NAME=<target> ... \
        python run_job.py agglo_ingest_job 033

For relaunching a whole domain (or everything) end-to-end including dbt, prefer
run_pipelines.py — this script runs a single named job for one partition.
"""

import sys

from dagster import DagsterInstance

import dagster_project.definitions as definitions_module


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: run_job.py <job_name> [partition_key]")
        return 2

    job_name = sys.argv[1]
    partition_key = sys.argv[2] if len(sys.argv) > 2 else None

    defs = definitions_module.defs
    defs = defs() if callable(defs) else defs
    job = defs.resolve_job_def(job_name)

    print(f"→ Executing job '{job_name}'"
          + (f" for partition '{partition_key}'" if partition_key else "")
          + " in-process…")
    result = job.execute_in_process(
        partition_key=partition_key,
        instance=DagsterInstance.get(),
        raise_on_error=False,
    )

    if not result.success:
        print("❌ Run failed. Failed steps:")
        for event in result.get_step_failure_events():
            error = getattr(event.event_specific_data, "error", None)
            message = error.to_string() if error is not None else "<no error info>"
            print(f"  • {event.step_key}:\n{message}")
        return 1

    print("✅ Run success.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
