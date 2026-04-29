from dagster import (
    AssetExecutionContext,
    MaterializeResult,
    MetadataValue,
    ScheduleDefinition,
    asset,
    define_asset_job,
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

box_token_refresh_schedule = ScheduleDefinition(
    job=box_token_refresh_job,
    cron_schedule="*/59 * * * *",
)