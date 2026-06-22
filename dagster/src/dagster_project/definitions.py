from pathlib import Path

from dagster import Definitions, EnvVar, definitions, load_from_defs_folder
from dagster_dbt import DbtCliResource
from dagster_project.defs.resources.box import BoxResource
from dagster_project.defs.dbt_noisemap.defs import noisemap_dbt_project

from dagster_project.io.db import db_url

@definitions
def defs():
    return Definitions.merge(
        load_from_defs_folder(path_within_project=Path(__file__).parent),
        Definitions(
            resources={
                "box": BoxResource(
                    client_id=EnvVar("BOX_CLIENT_ID"),
                    client_secret=EnvVar("BOX_CLIENT_SECRET"),
                    enterprise_id=EnvVar("BOX_ENTREPRISE_ID"),
                ),
                "dbt": DbtCliResource(project_dir=noisemap_dbt_project),
            }
        ),
    )
