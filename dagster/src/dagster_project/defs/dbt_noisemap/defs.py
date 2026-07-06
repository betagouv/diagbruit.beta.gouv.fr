import json
import os
from collections.abc import Mapping
from typing import Any, Optional

import dagster as dg
from dagster_dbt import DagsterDbtTranslator, DbtCliResource, DbtProject, dbt_assets

from dagster_project.defs.assets._partitions import ALL_DEPT_PARTITIONS
from dagster_project.io import DAGSTER_ROOT

noisemap_dbt_project = DbtProject(project_dir=DAGSTER_ROOT.parents[1] / "dbt")
noisemap_dbt_project.prepare_if_dev()

class _NoisemapDbtTranslator(DagsterDbtTranslator):
    """Match the key/group scheme used by the `dbt_ingest` component:
    key = node name (single segment), group_name = node.fqn[1] (the domain folder)."""

    def get_asset_spec(
        self,
        manifest: Mapping[str, Any],
        unique_id: str,
        project: Optional[DbtProject],
    ) -> dg.AssetSpec:
        spec = super().get_asset_spec(manifest, unique_id, project)
        # unique_id may be a model (in "nodes") or an upstream source (in "sources").
        node = manifest.get("nodes", {}).get(unique_id) or manifest.get("sources", {}).get(unique_id)
        name = (node or {}).get("name")
        if not name:
            return spec
        fqn = node.get("fqn", [])
        group = fqn[1] if len(fqn) > 1 else spec.group_name
        return spec.replace_attributes(key=dg.AssetKey(name), group_name=group)


@dbt_assets(
    manifest=noisemap_dbt_project.manifest_path,
    select="noisemap",
    dagster_dbt_translator=_NoisemapDbtTranslator(),
    partitions_def=ALL_DEPT_PARTITIONS,
)
def noisemap_dbt_assets(context: dg.AssetExecutionContext, dbt: DbtCliResource):
    # The partition key is a codedept (e.g. "033"); pass it to dbt so the
    # incremental noisemap models only (re)process that department.
    dbt_vars = {"codedept": context.partition_key}
    args = ["build", "--vars", json.dumps(dbt_vars)]
    # run_pipelines.py --full-refresh sets this to drop & rebuild the incremental
    # models (stg_noisemap, noisemap mart); it then rebuilds the full table and
    # ignores the codedept filter, so a single partitioned run is enough.
    if os.getenv("DBT_FULL_REFRESH") == "1":
        args.append("--full-refresh")
    yield from dbt.cli(args, context=context).stream()
