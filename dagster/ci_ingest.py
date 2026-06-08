"""Run a Dagster asset job to completion, in-process, for CI.

Usage:
    python ci_ingest.py <job_name> [partition_key]

Executes the job synchronously in a single process and exits non-zero if the
run fails, so CI surfaces ingestion errors loudly. This replaces the legacy
``ingestion/launch-ingestion.sh`` path: it provisions the ``public_workspace``
raw_* / geo_departements tables that the dbt build (and in turn the FastAPI
tests) consume.

The CLI run launchers (``dg launch`` / ``dagster asset materialize``) submit a
run asynchronously to a daemon and return before it finishes, which is unusable
for CI. ``execute_in_process`` runs everything here and now and reports success.

Requires the package importable as ``dagster_project`` (run with
``PYTHONPATH=src``) and the DB_*/AWS_* environment variables set. Box is not
needed: ``ci_landing_033_job`` is landing-only and reads source files from S3.
"""

import sys

from dagster import DagsterInstance

import dagster_project.definitions as definitions_module


def main() -> int:
    job_name = sys.argv[1] if len(sys.argv) > 1 else "ci_landing_033_job"
    partition_key = sys.argv[2] if len(sys.argv) > 2 else None

    defs = definitions_module.defs
    defs = defs() if callable(defs) else defs
    job = defs.resolve_job_def(job_name)

    print(f"→ Executing job '{job_name}'"
          + (f" for partition '{partition_key}'" if partition_key else "")
          + " in-process…")
    result = job.execute_in_process(
        partition_key=partition_key,
        instance=DagsterInstance.ephemeral(),
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
