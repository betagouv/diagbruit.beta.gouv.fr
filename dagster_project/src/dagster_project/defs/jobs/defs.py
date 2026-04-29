from dagster import AssetSelection, define_asset_job

full_launcher_job = define_asset_job(
    name="full_launcher_job",
    selection=AssetSelection.groups("launcher"),
)

full_landing_job = define_asset_job(
    name="full_landing_job",
    selection=AssetSelection.groups("landing"),
)

dept_033 = define_asset_job(
    name="dept_033",
    selection= AssetSelection.keys("agglo_033_launcher") 
    | AssetSelection.keys("agglo_033_landing") 
    | AssetSelection.keys("infra_033_launcher") 
    | AssetSelection.keys("infra_033_landing")
)

full_ingestion_job = define_asset_job(
    name="full_ingestion_job",
    selection=AssetSelection.keys("raw_full_stras_data") 
    | AssetSelection.keys("raw_full_osm_foods_data") 
    | AssetSelection.keys("raw_full_osm_schools_data") 
    | AssetSelection.keys("raw_peb")
)

strasbourg_job = define_asset_job(
    name="strasbourg_job",
    selection=AssetSelection.groups("strasbourg"),
)

osm_full_job = define_asset_job(
    name="osm_full_job",
    selection=AssetSelection.keys("osm_foods_launcher") | AssetSelection.keys("raw_full_osm_foods_data")
)

peb_full_job = define_asset_job(
    name="peb_job",
    selection=AssetSelection.keys("peb_launcher") | AssetSelection.keys("raw_peb")
)