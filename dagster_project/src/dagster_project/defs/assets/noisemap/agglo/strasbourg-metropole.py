from pathlib import Path

from dagster import AssetExecutionContext, asset

from dagster_project.defs.assets.noisemap.tools import box_to_s3_launcher, ingest_from_s3_landing
from dagster_project.defs.resources.box import BoxResource


BOX_AGGLO_067_FOLDER_ID = "380247162343"

file_name = Path(__file__).stem

dept="067"
type="agglo"
campaign="2022"

def _agglo_067_entry(file: str, typesource: str, cbstype: str, indicetype: str) -> dict:
    return {
        "name": file,
        "mapping": {
            "id": True,
            "geometry": True,
            "legende": {"from": "db_lo"},
            "typesource": {"value": typesource},
            "cbstype": {"value": cbstype},
            "indicetype": {"value": indicetype},
            "annee": {"value": "2021"},
            "codedept": {"value": "067"},
            "typeterr": {"value": "AGGLO"},
            "codeinfra": {"value": ""},
            "idcbs" :  {"value": ""},
            "producteur" :  {"value": ""},
            "zonedef" :  {"value": ""},
            "validedeb" :  {"value": ""},
            "validefin" :  {"value": ""},
        },
    }


mapping_agglo_067 = [
    _agglo_067_entry("EMS_2022_Aero_A_Lden.shp",  "A", "A", "LD"),
    _agglo_067_entry("EMS_2022_Aero_A_Ln.shp",    "A", "A", "LN"),
    _agglo_067_entry("EMS_2022_Aero_C_Lden.shp",  "A", "C", "LD"),
    _agglo_067_entry("EMS_2022_Aero_C_Ln.shp",    "A", "C", "LN"),
    _agglo_067_entry("EMS_2022_Fer_A_Lden.shp",   "F", "A", "LD"),
    _agglo_067_entry("EMS_2022_Fer_A_Ln.shp",     "F", "A", "LN"),
    _agglo_067_entry("EMS_2022_Fer_C_Lden.shp",   "F", "C", "LD"),
    _agglo_067_entry("EMS_2022_Fer_C_Ln.shp",     "F", "C", "LN"),
    _agglo_067_entry("EMS_2022_ICPE_A_Lden.shp",  "I", "A", "LD"),
    _agglo_067_entry("EMS_2022_ICPE_A_Ln.shp",    "I", "A", "LN"),
    _agglo_067_entry("EMS_2022_ICPE_C_Lden.shp",  "I", "C", "LD"),
    _agglo_067_entry("EMS_2022_ICPE_C_Ln.shp",    "I", "C", "LN"),
    _agglo_067_entry("EMS_2022_Route_A_Lden.shp", "R", "A", "LD"),
    _agglo_067_entry("EMS_2022_Route_A_Ln.shp",   "R", "A", "LN"),
    _agglo_067_entry("EMS_2022_Route_C_Lden.shp", "R", "C", "LD"),
    _agglo_067_entry("EMS_2022_Route_C_Ln.shp",   "R", "C", "LN"),
]


@asset(group_name="launcher", key="agglo_067_launcher")
def agglo_067_launcher(context: AssetExecutionContext, box: BoxResource):
    """Upload agglo 067 files from box and ingest into S3."""
    path= f"noisemap/cbs_{type}/territory={file_name}/campaign={campaign}/"
    return(box_to_s3_launcher(context=context, path=path,type=type,dept=dept, box=box, folder_id=BOX_AGGLO_067_FOLDER_ID, mapping=mapping_agglo_067))

@asset(group_name="landing", key="agglo_067_landing", deps=["agglo_067_launcher"])
def agglo_067_landing(context: AssetExecutionContext):
    """Download agglo 067 files from S3 and ingest into public_workspace.raw_noisemap."""
    path= f"noisemap/cbs_{type}/territory={file_name}/campaign={campaign}/"
    return(ingest_from_s3_landing(context,path=path,type=type,dept=dept))