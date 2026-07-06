"""Shared I/O helpers used by both Dagster definitions and ingestion scripts.

Anything Dagster-agnostic (S3 client, DB URL, manifest builders, …) belongs
here. Files under `dagster_project/defs/` should only produce Dagster
definitions (assets, jobs, schedules, sensors, resources, components).
"""

from pathlib import Path

# Absolute path to src/dagster_project/. Used to build paths into the sibling
# `ingestion/` folder.
DAGSTER_ROOT: Path = Path(__file__).resolve().parents[1]
