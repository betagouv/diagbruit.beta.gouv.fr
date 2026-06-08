from dataclasses import dataclass, field


@dataclass(frozen=True)
class PebTerritory:
    """One PEB ingestion config: data.gouv.fr GeoJSON (split by zone) → S3 → raw_peb.

    The national dataset is published as one GeoJSON per zone (A/B/C/D), all
    sharing the same columns and ingested into a single `raw_peb` table — the
    `zone` column already carries the value. `campaign` is not modelled here:
    it is derived per row from `date_arret` in dbt staging.
    """

    scope: str              # "national"
    urls: list[str] = field(default_factory=list)  # data.gouv.fr GeoJSON URLs (one per zone)


PEB_TERRITORIES: list[PebTerritory] = [
    PebTerritory(
        scope="national",
        urls=[
            "https://static.data.gouv.fr/resources/zonage-des-plan-dexposition-au-bruit-peb/20200602-202334/c-dgac-peb-metro-za.geojson",
            "https://static.data.gouv.fr/resources/zonage-des-plan-dexposition-au-bruit-peb/20200602-202306/c-dgac-peb-metro-zb.geojson",
            "https://static.data.gouv.fr/resources/zonage-des-plan-dexposition-au-bruit-peb/20200602-202327/c-dgac-peb-metro-zc.geojson",
            "https://static.data.gouv.fr/resources/zonage-des-plan-dexposition-au-bruit-peb/20200602-202316/c-dgac-peb-metro-zd.geojson",
        ],
    ),
]
