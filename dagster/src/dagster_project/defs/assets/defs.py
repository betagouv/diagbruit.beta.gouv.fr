from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile
from dagster_project.io import DAGSTER_ROOT
from dagster_project.io.db import db_url


@asset(
    key="geo_departements",
    group_name="departements",
    tags={"source": "local"},
    kinds={"postgres"},
)
def ingest_departements(context: AssetExecutionContext):
    """Ingest the French departments reference shapefile into public_workspace."""
    file_path = DAGSTER_ROOT / "reference_data" / "departments" / "depts.shp"
    context.log.info(f"Ingesting {file_path.name} → geo_departements")
    success = ingest_shapefile(
        str(file_path), "geo_departements", db_url(),
        schema="public_workspace", if_exists="replace", context=context,
    )
    return MaterializeResult(metadata={
        "status": MetadataValue.text("ok" if success else "failed"),
    })
