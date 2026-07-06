from dataclasses import dataclass


@dataclass(frozen=True)
class InfraTerritory:
    """One CBS infra dept ingestion config.

    Source: data.gouv.fr ZIP → extracted shapefiles → S3 → raw_noisemap.
    No per-file mapping list: every shapefile in the ZIP goes through the
    default `rename_infra` callback (codinfra → codeinfra, idzonbruit → id).
    """

    dept: str            # "033", "044", ...
    campaign: str        # value used in S3 path partition campaign={campaign}
    url: str = ""        # single data.gouv.fr ZIP URL (can be omitted when box_folder_id is set)
    box_folder_id: str = ""  # Box folder ID (used by infra_launcher_box when temporarily sourcing from Box)


INFRA_TERRITORIES: list[InfraTerritory] = [
    InfraTerritory(
        dept="033",
        campaign="2022",
        box_folder_id="388255826325"
    ),
    InfraTerritory(
        dept="044",
        campaign="2022",
        box_folder_id="388259414069"
    ),
    InfraTerritory(
        dept="013",
        campaign="2022",
        box_folder_id="388258972430"
    ),
    InfraTerritory(
        dept="035",
        campaign="2022",
        box_folder_id="388256464610"
    ),
    InfraTerritory(
        dept="059",
        campaign="2022",
        box_folder_id="388254805426"
    ),
    InfraTerritory(
        dept="067",
        campaign="2022",
        box_folder_id="388257438725"
    ),
]
