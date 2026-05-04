from dagster import AssetExecutionContext, asset

from dagster_project.defs.assets.noisemap.tools import box_to_s3_launcher, ingest_from_s3_landing
from dagster_project.defs.resources.box import BoxResource


BOX_AGGLO_033_FOLDER_ID = "378891546195"


def _agglo_033_entry(file: str, typesource: str, cbstype: str, indicetype: str, ignore_source: bool = False) -> dict:
    mapping = {
        "geometry": True,
        "legende": {"from": "category"},
        "typesource": {"value": typesource},
        "cbstype": {"value": cbstype},
        "indicetype": {"value": indicetype},
        "annee": {"value": "2022"},
        "codedept": {"value": "033"},
        "typeterr": {"value": "AGGLO"},
    }
    if not ignore_source:
        mapping["source"] = True

    return {"name": file, "mapping": mapping}


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


@asset(group_name="launcher", key="agglo_033_launcher")
def agglo_033_launcher(context: AssetExecutionContext, box: BoxResource):
    """Upload agglo 033 files from box and ingest into S3."""
    path= "noisemap/cbs_agglo/territory=bordeaux-metropole/campaign=2022/"
    return(box_to_s3_launcher(context=context, path=path, box=box, folder_id=BOX_AGGLO_033_FOLDER_ID, mapping=mapping_agglo_033))

@asset(group_name="landing", key="agglo_033_landing", deps=["agglo_033_launcher"])
def agglo_033_landing(context: AssetExecutionContext, box: BoxResource):
    """Download agglo 033 files from S3 and ingest into public_workspace.raw_noisemap."""
    path= "noisemap/cbs_agglo/territory=bordeaux-metropole/campaign=2022/"
    return(ingest_from_s3_landing(context,path=path, box=box, folder_id=BOX_AGGLO_033_FOLDER_ID))