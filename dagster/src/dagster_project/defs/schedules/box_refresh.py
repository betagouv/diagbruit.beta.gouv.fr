from dagster import (
    AssetExecutionContext,
    Config,
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


class BoxFolderInspectConfig(Config):
    folder_id: str = "0"  # Box root folder; override with any folder ID


@asset(
    key="box_folder_inspect",
    group_name="maintenance",
    kinds={"box"},
)
def box_folder_inspect(context: AssetExecutionContext, config: BoxFolderInspectConfig, box: BoxResource):
    client = box.get_client()
    items = client.folders.get_folder_items(config.folder_id)
    names = [item.name for item in items.entries]
    for name in names:
        context.log.info(name)
    return MaterializeResult(metadata={
        "folder_id": MetadataValue.text(config.folder_id),
        "file_count": MetadataValue.int(len(names)),
        "files": MetadataValue.json(names),
    })