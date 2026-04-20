from dagster import AssetSelection, define_asset_job

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

osm_job = define_asset_job(
    name="osm_job",
    selection=AssetSelection.groups("osm") 
)

full_noisesource_job = define_asset_job(
    name="full_noisesource_job",
    selection=AssetSelection.keys("raw_full_stras_data") 
    | AssetSelection.keys("raw_full_osm_foods_data") 
    | AssetSelection.keys("raw_full_osm_schools_data") 
    | AssetSelection.groups("strasbourg")
    | AssetSelection.groups("osm")
)

peb_job = define_asset_job(
    name="peb_job",
    selection=AssetSelection.groups("peb") ,
)