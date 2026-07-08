from dataclasses import dataclass, field


@dataclass(frozen=True)
class FastlineFile:
    """One shapefile inside a fastline Box folder, classified explicitly.

    Used for networks whose shapefiles don't carry the standard classification
    columns, so each file's type is specified here (mirrors AggloFile) instead
    of being read from source columns.
    """

    name: str
    typesource: str = ""  # "F" | "R" | ... → kind
    cbstype: str = ""  # "A" | "C" → acoustic_noisemap_kind
    indicetype: str = ""  # "LD" | "LN" → acoustic_time_range


@dataclass(frozen=True)
class FastlineTerritory:
    """One CBS infra-fastlines dept ingestion config.

    Source: Box folder → S3 → raw_noisemap.

    Two ingestion modes:
    - `is_infra=True`: the shapefiles carry the standard columns, so they go
      through the `rename_fastline` column mapping (typesource/cbstype/... read
      from source). No per-file config needed.
    - default (`is_infra=False`): the shapefiles lack those columns, so each one
      must be listed in `files` with its type (like agglo) and `db_value_from`
      must name the source column holding the dB value.
    """

    dept: str  # "033", "044", ...
    campaign: str  # value used in S3 path partition campaign={campaign}
    box_folder_id: str  # Box folder ID containing the .shp files
    is_infra: bool = False
    db_value_from: str = ""  # source column mapped onto acoustic_db_value (per-file mode)
    files: list[FastlineFile] = field(default_factory=list)

    def __post_init__(self):
        if self.is_infra:
            return
        if not self.files:
            raise ValueError(
                f"FastlineTerritory(dept={self.dept}): per-file mode requires a non-empty "
                f"`files` list (or set is_infra=True to use the column mapping)"
            )
        if not self.db_value_from:
            raise ValueError(
                f"FastlineTerritory(dept={self.dept}): per-file mode requires `db_value_from` "
                f"(or set is_infra=True to use the column mapping)"
            )


FASTLINE_TERRITORIES: list[FastlineTerritory] = [
    FastlineTerritory(
        dept="033",
        campaign="2022",
        box_folder_id="380068036799",
        is_infra=True,
    ),
    FastlineTerritory(
        dept="044",
        campaign="2022",
        box_folder_id="380219303992",
        is_infra=True,
    ),
    FastlineTerritory(
        dept="067",
        campaign="2022",
        box_folder_id="397866124269",
        db_value_from="category",
        files=[
            FastlineFile("N_BRUIT_ZBR_A_LN_067.shp", "R", "A", "LN"),
            FastlineFile("N_BRUIT_ZBR_A_LD_067.shp", "R", "A", "LD"),
        ],
    ),
]
