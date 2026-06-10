from dataclasses import dataclass


@dataclass(frozen=True)
class FastlineTerritory:
    """One CBS infra-fastlines dept ingestion config.

    Source: Box folder → S3 → raw_noisemap.
    No per-file mapping list: every shapefile in the Box folder goes through
    the default `rename_infra` callback (codinfra → codeinfra, idzonbruit → id).
    """

    dept: str  # "033", "044", ...
    campaign: str  # value used in S3 path partition campaign={campaign}
    box_folder_id: str  # Box folder ID containing the .shp files


FASTLINE_TERRITORIES: list[FastlineTerritory] = [
    FastlineTerritory(
        dept="033",
        campaign="2022",
        box_folder_id="380068036799",
    ),
    FastlineTerritory(
        dept="044",
        campaign="2022",
        box_folder_id="380219303992",
    ),
    FastlineTerritory(
        dept="013",
        campaign="2022",
        box_folder_id="381493761417",
    ),
    FastlineTerritory(
        dept="035",
        campaign="2022",
        box_folder_id="381494198290",
    ),
    FastlineTerritory(
        dept="059",
        campaign="2022",
        box_folder_id="381494579423",
    ),
    FastlineTerritory(
        dept="067",
        campaign="2022",
        box_folder_id="381496213487",
    ),
]
