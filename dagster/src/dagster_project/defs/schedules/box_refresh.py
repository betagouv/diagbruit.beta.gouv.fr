from dagster import (
    AssetExecutionContext,
    MaterializeResult,
    MetadataValue,
    asset,
    define_asset_job,
)

from dagster_project.defs.resources.box import BoxResource


@asset(
    key="box_connectivity_check",
    group_name="maintenance",
    kinds={"box"},
)
def box_connectivity_check(context: AssetExecutionContext, box: BoxResource):
    client = box.get_client()
    me = client.users.get_user_me()
    context.log.info(f"Box CCG authenticated as {me.login}")
    return MaterializeResult(metadata={"user": MetadataValue.text(me.login or "")})


box_connectivity_check_job = define_asset_job(
    "box_connectivity_check_job",
    selection=["box_connectivity_check"],
)
