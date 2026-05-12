from dagster import AssetExecutionContext, asset

from dagster_project.defs.assets.noisemap._io import s3_landing, s3_launcher

GROUP = "noisemap_infra"
SOURCE = "data.gouv"

DEPT033_URL = [
    "https://www.data.gouv.fr/api/1/datasets/r/b4cf0f5e-4b99-4af3-916e-1d8c2625fce2"
]

DEPT044_URL = [
    "https://www.data.gouv.fr/api/1/datasets/r/e9b82009-955b-4997-bf1d-f6a542eadda3"
]


@asset(
    key="infra_033_launcher",
    group_name=GROUP,
    tags={"dept": "033", "stage": "launcher", "source": SOURCE},
    kinds={"s3"},
)
def infra_033_launcher(context: AssetExecutionContext):
    """Download infra 033 ZIPs from data.gouv.fr, extract, upload to S3, and write mapping."""
    path = "noisemap/cbs_infra/dept=033/campaign=2022/"
    return s3_launcher(context=context, path=path, arr_url=DEPT033_URL)


@asset(
    key="infra_044_launcher",
    group_name=GROUP,
    tags={"dept": "044", "stage": "launcher", "source": SOURCE},
    kinds={"s3"},
)
def infra_044_launcher(context: AssetExecutionContext):
    """Download infra 044 ZIPs from data.gouv.fr, extract, upload to S3, and write mapping."""
    path = "noisemap/cbs_infra/dept=044/campaign=2022/"
    return s3_launcher(context=context, path=path, arr_url=DEPT044_URL)


@asset(
    key="infra_033_landing",
    group_name=GROUP,
    tags={"dept": "033", "stage": "landing", "source": SOURCE},
    kinds={"s3", "postgres"},
    deps=["infra_033_launcher"],
)
def infra_033_landing(context: AssetExecutionContext):
    """Download infra 033 files from S3 and ingest into public_workspace.raw_noisemap."""
    path = "noisemap/cbs_infra/dept=033/campaign=2022/"
    return s3_landing(context=context, path=path, db_table="raw_noisemap")


@asset(
    key="infra_044_landing",
    group_name=GROUP,
    tags={"dept": "044", "stage": "landing", "source": SOURCE},
    kinds={"s3", "postgres"},
    deps=["infra_044_launcher"],
)
def infra_044_landing(context: AssetExecutionContext):
    """Download infra 044 files from S3 and ingest into public_workspace.raw_noisemap."""
    path = "noisemap/cbs_infra/dept=044/campaign=2022/"
    return s3_landing(context=context, path=path, db_table="raw_noisemap")
