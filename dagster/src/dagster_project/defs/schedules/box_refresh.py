from dagster import (
    AssetExecutionContext,
    Config,
    DefaultSensorStatus,
    MaterializeResult,
    MetadataValue,
    RunRequest,
    asset,
    define_asset_job,
    sensor,
)

from dagster_project.defs.resources.box import BoxResource


@asset(
    key="box_token_refresh",
    group_name="maintenance",
    kinds={"box"},
)
def box_token_refresh(context: AssetExecutionContext, box: BoxResource):
    client = box.get_client()
    me = client.users.get_user_me()
    context.log.info(f"Box token refreshed — authenticated as {me.login}")
    return MaterializeResult(metadata={"user": MetadataValue.text(me.login or "")})


box_token_refresh_job = define_asset_job(
    "box_token_refresh_job",
    selection=["box_token_refresh"],
)


class BoxFolderInspectConfig(Config):
    folder_id: str


@asset(
    key="box_folder_inspect",
    group_name="maintenance",
    kinds={"box"},
)
def box_folder_inspect(context: AssetExecutionContext, config: BoxFolderInspectConfig, box: BoxResource):
    client = box.get_client()
    items = client.folders.get_folder_items("380266508680")
    names = [item.name for item in items.entries]
    for name in names:
        context.log.info(name)
    return MaterializeResult(metadata={
        "folder_id": MetadataValue.text(config.folder_id),
        "file_count": MetadataValue.int(len(names)),
        "files": MetadataValue.json(names),
    })