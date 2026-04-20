from dagster import AssetSelection, define_asset_job

full_ingestion_job = define_asset_job(
    name="full_ingestion_job",
    selection=AssetSelection.groups("ingestion"),
)
strasbourg_job = define_asset_job(
    name="strasbourg_job",
    selection=AssetSelection.keys("raw_full_stras_data") | AssetSelection.groups("strasbourg"),
)

full_noisesource_job = define_asset_job(
    name="full_noisesource_job",
    selection=AssetSelection.groups("ingestion") | AssetSelection.groups("strasbourg") | AssetSelection.groups("osm") ,
)