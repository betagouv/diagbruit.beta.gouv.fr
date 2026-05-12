from dagster import AssetExecutionContext, asset

from dagster_project.defs.assets.noisemap._io import box_to_s3_launcher, ingest_from_s3_landing
from dagster_project.defs.resources.box import BoxResource

BOX_FOLDER_033_ID = "380068036799"
BOX_FOLDER_044_ID = "380219303992"

@asset(group_name="launcher", key="fastline_033_launcher")
def fastline_033_launcher(context: AssetExecutionContext, box: BoxResource):
    """Upload infra fastline 033 files from box and ingest into S3."""
    dept = '033'
    path= f"noisemap/cbs_infra_fastlines/dept={dept}/campaign=2022/"
    return(box_to_s3_launcher(context=context, path=path, type="fastline",dept=dept, box=box, folder_id=BOX_FOLDER_033_ID))

@asset(group_name="landing", key="fastline_033_landing", deps=["fastline_033_launcher"])
def fastline_033_landing(context: AssetExecutionContext):
    """Download infra fastline 033 files from S3 and ingest into public_workspace.raw_noisemap."""
    dept = '033'
    path= f"noisemap/cbs_infra_fastlines/dept={dept}/campaign=2022/"
    return(ingest_from_s3_landing(context,path=path, type="fastline",dept=dept))

@asset(group_name="launcher", key="fastline_044_launcher")
def fastline_044_launcher(context: AssetExecutionContext, box: BoxResource):
    """Upload infra fastline 044 files from box and ingest into S3."""
    dept = '044'
    path= f"noisemap/cbs_infra_fastlines/dept={dept}/campaign=2022/"
    return(box_to_s3_launcher(context=context, path=path, type="fastline",dept=dept, box=box, folder_id=BOX_FOLDER_044_ID))

@asset(group_name="landing", key="fastline_044_landing", deps=["fastline_044_launcher"])
def fastline_044_landing(context: AssetExecutionContext):
    """Download infra fastline 044 files from S3 and ingest into public_workspace.raw_noisemap."""
    dept = '044'
    path= f"noisemap/cbs_infra_fastlines/dept={dept}/campaign=2022/"
    return(ingest_from_s3_landing(context,path=path, type="fastline",dept=dept))