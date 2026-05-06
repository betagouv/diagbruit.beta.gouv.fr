from pathlib import Path

from dagster import AssetExecutionContext, asset

from dagster_project.defs.assets.noisemap.tools import box_to_s3_launcher, ingest_from_s3_landing
from dagster_project.defs.resources.box import BoxResource


BOX_FOLDER_ID = "380409798844"

file_name = Path(__file__).stem

dept="059"
type="agglo"
campaign="2021"

def _agglo_059_entry(file: str, typesource: str, cbstype: str, indicetype: str) -> dict:
    return {
        "name": file,
        "mapping": {
            "id": True,
            "geometry": True,
            "legende": {"from": "low_val"},
            "typesource": {"value": typesource},
            "cbstype": {"value": cbstype},
            "indicetype": {"value": indicetype},
            "annee": {"value": "2021"},
            "codedept": {"value": dept},
            "typeterr": {"value": "AGGLO"},
            "codeinfra": {"value": ""},
            "idcbs" :  {"value": ""},
            "producteur" :  {"value": ""},
            "zonedef" :  {"value": ""},
            "validedeb" :  {"value": ""},
            "validefin" :  {"value": ""},
        },
    }


mapping_agglo_059 = [
    _agglo_059_entry("ROUTES_Lden-C.shp",   "R", "C", "LD"),
    _agglo_059_entry("ROUTES_Lden-A.shp",   "R", "A", "LD"),
    _agglo_059_entry("ROUTES_Ln-C.shp",     "R", "C", "LN"),
    _agglo_059_entry("ROUTES_Ln-A.shp",     "R", "A", "LN"),
    _agglo_059_entry("MEL-TypeA_Lden.shp",  "F", "A", "LD"),
    _agglo_059_entry("MEL-TypeA_Ln.shp",    "F", "A", "LN"),
    _agglo_059_entry("ICPE-Lden-A_MEL.shp", "I", "A", "LD"),
    _agglo_059_entry("ICPE-Ln-A_MEL.shp",   "I", "A", "LN"),
]


@asset(group_name="launcher", key="agglo_059_launcher")
def agglo_059_launcher(context: AssetExecutionContext, box: BoxResource):
    """Upload agglo 059 files from box and ingest into S3."""
    path= f"noisemap/cbs_{type}/territory={file_name}/campaign={campaign}/"
    return(box_to_s3_launcher(context=context, path=path,type=type,dept=dept, box=box, folder_id=BOX_FOLDER_ID, mapping=mapping_agglo_059))

@asset(group_name="landing", key="agglo_059_landing", deps=["agglo_059_launcher"])
def agglo_059_landing(context: AssetExecutionContext):
    """Download agglo 059 files from S3 and ingest into public_workspace.raw_noisemap."""
    path= f"noisemap/cbs_{type}/territory={file_name}/campaign={campaign}/"
    return(ingest_from_s3_landing(context,path=path,type=type,dept=dept))