from dataclasses import dataclass, field


@dataclass(frozen=True)
class FastlineFile:
    """One shapefile inside a *concédé* fastline Box folder.

    Concédé sources don't carry the standard classification columns, so each
    file's type is specified here (mirrors AggloFile) instead of being read
    from source columns by `rename_fastline`.
    """

    name: str
    typesource: str = ""  # "F" | "R" | ... → kind
    cbstype: str = ""  # "A" | "C" → acoustic_noisemap_kind
    indicetype: str = ""  # "LD" | "LN" → acoustic_time_range


@dataclass(frozen=True)
class FastlineTerritory:
    """One CBS infra-fastlines dept ingestion config.

    Source: Box folder → S3 → raw_noisemap.

    By default every shapefile in the Box folder is classified by the
    `rename_fastline` callback (which reads typesource/cbstype/... from source
    columns).

    Set `is_concede=True` for *concédé* networks whose shapefiles lack those
    columns: you must then list each file in `files` with its type (like agglo)
    and give `legende_from` (the source column holding the dB value).
    """

    dept: str  # "033", "044", ...
    campaign: str  # value used in S3 path partition campaign={campaign}
    box_folder_id: str  # Box folder ID containing the .shp files
    is_concede: bool = False
    db_value_from: str = ""  # source column mapped onto acoustic_db_value (concédé only)
    files: list[FastlineFile] = field(default_factory=list)

    def __post_init__(self):
        if self.is_concede:
            if not self.files:
                raise ValueError(
                    f"FastlineTerritory(dept={self.dept}): is_concede=True requires a non-empty `files` list"
                )
            if not self.db_value_from:
                raise ValueError(
                    f"FastlineTerritory(dept={self.dept}): is_concede=True requires `db_value_from`"
                )


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
        dept="067",
        campaign="2022",
        box_folder_id="397866124269",
        is_concede=True,
        db_value_from="category",
        files= [
            FastlineFile("N_BRUIT_ZBR_A_LN_067.shp", "R", "A", "LN"),
            FastlineFile("N_BRUIT_ZBR_A_LD_067.shp", "R", "A", "LD")
        ]
    ),
]
