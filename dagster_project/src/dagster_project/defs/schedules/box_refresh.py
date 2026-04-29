from dagster import (
    AssetExecutionContext,
    DefaultSensorStatus,
    MaterializeResult,
    MetadataValue,
    RunRequest,
    asset,
    define_asset_job,
    sensor,
)

from dagster_project.defs.resources.box import BoxResource


@asset(group_name="maintenance", key="box_token_refresh")
def box_token_refresh(context: AssetExecutionContext, box: BoxResource):
    client = box.get_client()
    me = client.users.get_user_me()
    context.log.info(f"Box token refreshed — authenticated as {me.login}")
    return MaterializeResult(metadata={"user": MetadataValue.text(me.login or "")})


box_token_refresh_job = define_asset_job(
    "box_token_refresh_job",
    selection=["box_token_refresh"],
)


@sensor(
    job=box_token_refresh_job,
    minimum_interval_seconds=3000,
    default_status=DefaultSensorStatus.RUNNING,
)
def box_token_refresh_sensor(context):
    yield RunRequest()