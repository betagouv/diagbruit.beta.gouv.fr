
from pathlib import Path
import json
import shutil

from dagster import AssetExecutionContext, MaterializeResult, MetadataValue, asset

from dagster_project.ingestion.ingest_shapefiles import ingest_shapefile
from dagster_project.defs.jobs.tools import _db_url, download_from_s3, s3, S3_BUCKET, DAGSTER_ROOT

def _agglo_033_entry(file: str, typesource: str, cbstype: str, indicetype: str, ignore_source: bool = False) -> dict:
    return {
        "file": file,
        "if_exists": "append",
        "add_columns": {"typesource": typesource, "cbstype": cbstype, "indicetype": indicetype, "annee": "2022", "codedept": "033", "typeterr": "AGGLO"},
        "rename_columns": {"category": "legende"},
        "ignore_columns": ["gid", "source"] if ignore_source else ["gid"],
    }

mapping_agglo_033 = [
    _agglo_033_entry("fer_depassement_de_seuil_Lden.shp","F", "C", "LD"),
    _agglo_033_entry("industrie_depassement_de_seuil_Lden.shp","I", "C", "LD"),
    _agglo_033_entry("route_depassement_de_seuil_Lden.shp","R", "C", "LD"),
    _agglo_033_entry("fer_depassement_de_seuil_Lnight.shp","F", "C", "LN"),
    _agglo_033_entry("industrie_depassement_de_seuil_Lnight.shp","I", "C", "LN"),
    _agglo_033_entry("route_depassement_de_seuil_Lnight.shp","R", "C", "LN"),
    
    _agglo_033_entry("NoiseContours_airportsInAgglomeration_Lden.shp","A", "A", "LD", ignore_source=True),
    _agglo_033_entry("NoiseContours_industryInAgglomeration_Lden.shp","I", "A", "LD", ignore_source=True),
    _agglo_033_entry("NoiseContours_railwaysInAgglomeration_Lden.shp","F", "A", "LD", ignore_source=True),
    _agglo_033_entry("NoiseContours_roadsInAgglomeration_Lden.shp","R", "A", "LD", ignore_source=True),
    _agglo_033_entry("NoiseContours_airportsInAgglomeration_Lnight.shp","A", "A", "LN", ignore_source=True),
    _agglo_033_entry("NoiseContours_industryInAgglomeration_Lnight.shp","I", "A", "LN", ignore_source=True),
    _agglo_033_entry("NoiseContours_railwaysInAgglomeration_Lnight.shp","F", "A", "LN", ignore_source=True),
    _agglo_033_entry("NoiseContours_roadsInAgglomeration_Lnight.shp","R", "A", "LN", ignore_source=True),
]

@asset(group_name="launcher", key="agglo_033")
def agglo_launcher(context: AssetExecutionContext):
    """[WIP]Uploads mapping for agglo 033 [WIP]"""
    s3_path = "noisemap/cbs_agglo/territory=bordeaux-metropole/campaign=2022/"
    file_path = DAGSTER_ROOT / "ingestion" / "inputs" / Path(s3_path)
    file_path.parent.mkdir(parents=True, exist_ok=True)

    mapping_key = s3_path + "mapping.json"

    s3.put_object(
        Bucket=S3_BUCKET,
        Key=mapping_key,
        Body=json.dumps(mapping_agglo_033, indent=2),
        ContentType="application/json",
    )

    context.log.info(f"Uploaded mapping → s3://{S3_BUCKET}/{mapping_key}")

    return MaterializeResult(metadata={
            "bucket": MetadataValue.text(S3_BUCKET),
            "prefix": MetadataValue.text(s3_path),
            "mapping": MetadataValue.json(mapping_agglo_033),
    })

    shutil.rmtree(local_dir)
    context.log.info(f"Cleaned up {local_dir}")

    return MaterializeResult(metadata={
        "files_downloaded": MetadataValue.int(downloaded),
        "files_ingested": MetadataValue.int(ingested),
        "files_skipped": MetadataValue.int(skipped),
    })


