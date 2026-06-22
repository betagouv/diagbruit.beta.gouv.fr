"""Run a Dagster asset job to completion, in-process, for CI.

    python ci_ingest.py <job_name> [partition_key]   # run with PYTHONPATH=src

Uses ``execute_in_process`` (not ``dg launch`` / ``dagster asset materialize``,
which submit asynchronously and return before the run finishes) so the exit code
reflects the run outcome.
"""

import sys

from dagster import DagsterInstance

import dagster_project.definitions as definitions_module


def main() -> int:
    job_name = sys.argv[1] if len(sys.argv) > 1 else "ci_landing_by_codedept_job"
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
