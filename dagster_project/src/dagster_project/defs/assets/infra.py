from dagster import AssetExecutionContext, asset
from dagster_project.defs.jobs.tools import s3_launcher, s3_landing

DEPT033_URL = [
    "https://www.data.gouv.fr/api/1/datasets/r/17e3754b-b23a-4c5d-be5c-becb000a9d4c",
    "https://www.data.gouv.fr/api/1/datasets/r/7bc3ddc2-cded-4b4e-bdc5-0c270ecb6201",
    "https://www.data.gouv.fr/api/1/datasets/r/00872b29-5e87-4d24-ba33-28c0faa808a1",
    "https://www.data.gouv.fr/api/1/datasets/r/b5033591-4cbc-4160-87d7-fae72776ac62",
    "https://www.data.gouv.fr/api/1/datasets/r/58ea856f-99e7-4a49-b20d-432076a430c7",
    "https://www.data.gouv.fr/api/1/datasets/r/3bcd60ce-0a1d-4500-bf73-73e20d65af9b",
    "https://www.data.gouv.fr/api/1/datasets/r/c680c193-25ac-46ed-907c-05962f260088",
    "https://www.data.gouv.fr/api/1/datasets/r/18e1bb2e-c5ea-4e09-abd7-f07adb3ced94",
    "https://www.data.gouv.fr/api/1/datasets/r/0598a10c-89f0-4eae-8b8f-7ecda5e770be",
    "https://www.data.gouv.fr/api/1/datasets/r/ad82bc06-5f23-4ca0-935f-8f16feba630b",
    "https://www.data.gouv.fr/api/1/datasets/r/d7546128-fb23-4cbd-a43a-42d0e2890286",
    "https://www.data.gouv.fr/api/1/datasets/r/5cb02473-5c7a-416a-a883-c22fce652819"
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