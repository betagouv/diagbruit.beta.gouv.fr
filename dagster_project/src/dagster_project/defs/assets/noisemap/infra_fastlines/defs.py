from dagster import AssetExecutionContext, asset

from dagster_project.defs.assets.noisemap._io import box_to_s3_launcher, ingest_from_s3_landing
from dagster_project.defs.resources.box import BoxResource

GROUP = "noisemap_fastline"
SOURCE = "box"

BOX_FOLDER_033_ID = "380068036799"
BOX_FOLDER_044_ID = "380219303992"


@asset(
    key="fastline_033_launcher",
    group_name=GROUP,
    tags={"dept": "033", "stage": "launcher", "source": SOURCE},
    kinds={"box", "s3"},
)
def fastline_033_launcher(context: AssetExecutionContext, box: BoxResource):
    """Upload infra fastline 033 files from box and ingest into S3."""
    dept = "033"
    path = f"noisemap/cbs_infra_fastlines/dept={dept}/campaign=2022/"
    return box_to_s3_launcher(
        context=context, path=path, type="fastline", dept=dept, box=box, folder_id=BOX_FOLDER_033_ID
    )


@asset(
    key="fastline_033_landing",
    group_name=GROUP,
    tags={"dept": "033", "stage": "landing", "source": SOURCE},
    kinds={"s3", "postgres"},
    deps=["fastline_033_launcher"],
)
def fastline_033_landing(context: AssetExecutionContext):
    """Download infra fastline 033 files from S3 and ingest into public_workspace.raw_noisemap."""
    dept = "033"
    path = f"noisemap/cbs_infra_fastlines/dept={dept}/campaign=2022/"
    return ingest_from_s3_landing(context, path=path, type="fastline", dept=dept)


@asset(
    key="fastline_044_launcher",
    group_name=GROUP,
    tags={"dept": "044", "stage": "launcher", "source": SOURCE},
    kinds={"box", "s3"},
)
def fastline_044_launcher(context: AssetExecutionContext, box: BoxResource):
    """Upload infra fastline 044 files from box and ingest into S3."""
    dept = "044"
    path = f"noisemap/cbs_infra_fastlines/dept={dept}/campaign=2022/"
    return box_to_s3_launcher(
        context=context, path=path, type="fastline", dept=dept, box=box, folder_id=BOX_FOLDER_044_ID
    )


@asset(
    key="fastline_044_landing",
    group_name=GROUP,
    tags={"dept": "044", "stage": "landing", "source": SOURCE},
    kinds={"s3", "postgres"},
    deps=["fastline_044_launcher"],
)
def fastline_044_landing(context: AssetExecutionContext):
    """Download infra fastline 044 files from S3 and ingest into public_workspace.raw_noisemap."""
    dept = "044"
    path = f"noisemap/cbs_infra_fastlines/dept={dept}/campaign=2022/"
    return ingest_from_s3_landing(context, path=path, type="fastline", dept=dept)
