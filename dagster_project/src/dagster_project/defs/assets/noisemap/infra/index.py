from dagster import AssetExecutionContext, asset
from dagster_project.defs.jobs.tools import s3_launcher, s3_landing

DEPT033_URL = [
    "https://www.data.gouv.fr/api/1/datasets/r/b4cf0f5e-4b99-4af3-916e-1d8c2625fce2"
]

DEPT044_URL = [
    "https://www.data.gouv.fr/api/1/datasets/r/e9b82009-955b-4997-bf1d-f6a542eadda3"
]

@asset(group_name="launcher", key="infra_033_launcher")
def infra_033_launcher(context: AssetExecutionContext):
    """Download infra 033 ZIPs from data.gouv.fr, extract, upload to S3, and write mapping."""
    path = "noisemap/cbs_infra/dept=033/campaign=2022/"
    return(s3_launcher(context=context,path=path, arr_url=DEPT033_URL))

@asset(group_name="launcher", key="infra_044_launcher")
def infra_044_launcher(context: AssetExecutionContext):
    """Download infra 044 ZIPs from data.gouv.fr, extract, upload to S3, and write mapping."""
    path = "noisemap/cbs_infra/dept=044/campaign=2022/"
    return(s3_launcher(context=context,path=path, arr_url=DEPT044_URL))

@asset(group_name="landing", key="infra_033_landing", deps=["infra_033_launcher"])
def infra_033_landing(context: AssetExecutionContext):
    """Download infra 033 files from S3 and ingest into public_workspace.raw_noisemap."""
    path = "noisemap/cbs_infra/dept=033/campaign=2022/"
    return(s3_landing(context=context, path=path, db_name= "raw_noisemap"))

@asset(group_name="landing", key="infra_044_landing", deps=["infra_044_launcher"])
def infra_044_landing(context: AssetExecutionContext):
    """Download infra 044 ZIPs from S3 and ingest into public_workspace.raw_noisemap."""
    path = "noisemap/cbs_infra/dept=044/campaign=2022/"
    return(s3_landing(context=context, path=path,  db_name= "raw_noisemap"))