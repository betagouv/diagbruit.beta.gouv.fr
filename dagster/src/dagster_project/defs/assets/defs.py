from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.ingestion.ingest_geojson import ingest_geojson
from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile
from dagster_project.io import DAGSTER_ROOT
from dagster_project.io.db import db_url


@asset(
    key="raw_full_stras_data",
    group_name="strasbourg",
    tags={"source": "local"},
    kinds={"postgres"},
)
def ingest_strasbourg(context: AssetExecutionContext):
    """Ingest Strasbourg terrasses GeoJSON into public_workspace."""
    file_path = DAGSTER_ROOT / "reference_data" / "strasbourg" / "strasbourg-terrasses-autorisees-2025.geojson"
    context.log.info(f"Ingesting {file_path.name} → raw_full_stras_data")
    row_count = ingest_geojson(str(file_path), "raw_full_stras_data", db_url(), schema="public_workspace", if_exists="replace")
    return MaterializeResult(metadata={
        "row_count": MetadataValue.int(row_count),
    })


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
