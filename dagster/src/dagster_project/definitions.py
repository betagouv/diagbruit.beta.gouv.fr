from pathlib import Path

from dagster import Definitions, EnvVar, definitions, load_from_defs_folder
from dagster_project.defs.resources.box import BoxResource

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
                    user_id=EnvVar("BOX_USER_ID"),
                )
            }
        ),
    )