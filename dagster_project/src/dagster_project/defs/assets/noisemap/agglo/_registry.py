from dataclasses import dataclass


@dataclass(frozen=True)
class AggloFile:
    """One shapefile inside an agglo Box folder.

    keep_source: whether the source shapefile has a `source` column that should
    be preserved in raw_noisemap (true for Bordeaux's depassement-de-seuil files,
    false everywhere else including Bordeaux's NoiseContours_* files).
    """

    name: str
    typesource: str  # "F" | "I" | "R" | "A"
    cbstype: str  # "A" | "C"
    indicetype: str  # "LD" | "LN"
    keep_source: bool = False


@dataclass(frozen=True)
class AggloTerritory:
    slug: str  # used as territory={slug} in S3 path; was Path(__file__).stem
    dept: str  # "033", "044", "059", "067"
    annee: str  # value written into the `annee` mapping column
    campaign: str  # value used in S3 path partition campaign={campaign}
    box_folder_id: str
    legende_from: str  # source column name mapped onto `legende`
    files: list[AggloFile]


AGGLO_TERRITORIES: list[AggloTerritory] = [
    AggloTerritory(
        slug="bordeaux-metropole",
        dept="033",
        annee="2022",
        campaign="2022",
        box_folder_id="378891546195",
        legende_from="category",
        files=[
            AggloFile(
                "fer_depassement_de_seuil_Lden.shp", "F", "C", "LD", keep_source=True
            ),
            AggloFile(
                "industrie_depassement_de_seuil_Lden.shp",
                "I",
                "C",
                "LD",
                keep_source=True,
            ),
            AggloFile(
                "route_depassement_de_seuil_Lden.shp", "R", "C", "LD", keep_source=True
            ),
            AggloFile(
                "fer_depassement_de_seuil_Lnight.shp", "F", "C", "LN", keep_source=True
            ),
            AggloFile(
                "industrie_depassement_de_seuil_Lnight.shp",
                "I",
                "C",
                "LN",
                keep_source=True,
            ),
            AggloFile(
                "route_depassement_de_seuil_Lnight.shp",
                "R",
                "C",
                "LN",
                keep_source=True,
            ),
            AggloFile("NoiseContours_airportsInAgglomeration_Lden.shp", "A", "A", "LD"),
            AggloFile("NoiseContours_industryInAgglomeration_Lden.shp", "I", "A", "LD"),
            AggloFile("NoiseContours_railwaysInAgglomeration_Lden.shp", "F", "A", "LD"),
            AggloFile("NoiseContours_roadsInAgglomeration_Lden.shp", "R", "A", "LD"),
            AggloFile(
                "NoiseContours_airportsInAgglomeration_Lnight.shp", "A", "A", "LN"
            ),
            AggloFile(
                "NoiseContours_industryInAgglomeration_Lnight.shp", "I", "A", "LN"
            ),
            AggloFile(
                "NoiseContours_railwaysInAgglomeration_Lnight.shp", "F", "A", "LN"
            ),
            AggloFile("NoiseContours_roadsInAgglomeration_Lnight.shp", "R", "A", "LN"),
        ],
    ),
    AggloTerritory(
        slug="nantes-metropole",
        dept="044",
        annee="2022",
        campaign="2022",
        box_folder_id="380266508680",
        legende_from="db_lo",
        files=[
            AggloFile("EMS_2022_Aero_A_Lden.shp", "A", "A", "LD"),
            AggloFile("EMS_2022_Aero_A_Ln.shp", "A", "A", "LN"),
            AggloFile("EMS_2022_Aero_C_Lden.shp", "A", "C", "LD"),
            AggloFile("EMS_2022_Aero_C_Ln.shp", "A", "C", "LN"),
            AggloFile("EMS_2022_Fer_A_Lden.shp", "F", "A", "LD"),
            AggloFile("EMS_2022_Fer_A_Ln.shp", "F", "A", "LN"),
            AggloFile("EMS_2022_Fer_C_Lden.shp", "F", "C", "LD"),
            AggloFile("EMS_2022_Fer_C_Ln.shp", "F", "C", "LN"),
            AggloFile("EMS_2022_ICPE_A_Lden.shp", "I", "A", "LD"),
            AggloFile("EMS_2022_ICPE_A_Ln.shp", "I", "A", "LN"),
            AggloFile("EMS_2022_ICPE_C_Lden.shp", "I", "C", "LD"),
            AggloFile("EMS_2022_ICPE_C_Ln.shp", "I", "C", "LN"),
            AggloFile("EMS_2022_Route_A_Lden.shp", "R", "A", "LD"),
            AggloFile("EMS_2022_Route_A_Ln.shp", "R", "A", "LN"),
            AggloFile("EMS_2022_Route_C_Lden.shp", "R", "C", "LD"),
            AggloFile("EMS_2022_Route_C_Ln.shp", "R", "C", "LN"),
        ],
    ),
    AggloTerritory(
        slug="aix-marseille-provence-metropole",
        dept="013",
        annee="2022",
        campaign="2022",
        box_folder_id="381451282918",
        legende_from="isophone",
        files=[
            AggloFile(
                "bruit-aerien-type-a-lden-sur-24h-etude-de-bruit-impedance-ingenierie.shp",
                "A",
                "A",
                "LD",
            ),
            AggloFile(
                "bruit-aerien-type-a-ln-22h-6h-etude-de-bruit-impedance-ingenierie.shp",
                "A",
                "A",
                "LN",
            ),
            AggloFile(
                "bruit-aerien-type-c-lden-sur-24h-etude-de-bruit-impedance-ingenierie.shp",
                "A",
                "C",
                "LD",
            ),
            AggloFile(
                "bruit-industriel-type-a-lden-sur-24h-etude-de-bruit-impedance-ingenierie.shp",
                "I",
                "A",
                "LD",
            ),
            AggloFile(
                "bruit-industriel-type-c-lden-sur-24h-etude-de-bruit-impedance-ingenierie.shp",
                "I",
                "C",
                "LD",
            ),
            AggloFile(
                "bruit-industriel-type-c-ln-22h-6h-etude-de-bruit-impedance-ingenierie.shp",
                "I",
                "C",
                "LN",
            ),
            AggloFile(
                "bruit-routier-type-c-ln-22h-6h-etude-de-bruit-impedance-ingenierie.shp",
                "R",
                "C",
                "LN",
            ),
            AggloFile(
                "fr-observatoire-du-bruit-bruit_isophone_ferroviaire_a_ln.shp",
                "F",
                "A",
                "LN",
            ),
            AggloFile(
                "fr-observatoire-du-bruit-n_bruit_isophone_ferroviaire_c_ln.shp",
                "F",
                "C",
                "LN",
            ),
            AggloFile("N_BRUIT_ISOPHONE_ROUTIER_A_LDEN.shp", "R", "A", "LD"),
            AggloFile("N_BRUIT_ISOPHONE_ROUTIER_A_LN.shp", "R", "A", "LN"),
            AggloFile("N_BRUIT_ISOPHONE_ROUTIER_C_LDEN.shp", "R", "C", "LD"),
            AggloFile(
                "observatoire-du-bruit-n_bruit_isophone_ferroviaire_a_lden.shp",
                "F",
                "A",
                "LD",
            ),
            AggloFile(
                "observatoire-du-bruit-n_bruit_isophone_ferroviaire_c_lden.shp",
                "F",
                "C",
                "LD",
            ),
        ],
    ),
    # AggloTerritory(
    #     slug="rennes-metropole",
    #     dept="035",
    #     annee="2021",
    #     campaign="2021",
    #     box_folder_id="TODO",  # not yet uploaded to Box (was local in legacy bash)
    #     legende_from="from_",  # column literally named `from_` in the source shapefiles
    #     files=[
    #         AggloFile("NOISE_A_A_LD.shp", "A", "A", "LD"),
    #         AggloFile("NOISE_A_F_LD.shp", "F", "A", "LD"),
    #         AggloFile("NOISE_A_F_LN.shp", "F", "A", "LN"),
    #         AggloFile("NOISE_A_I_LD.shp", "I", "A", "LD"),
    #         AggloFile("NOISE_A_I_LN.shp", "I", "A", "LN"),
    #         AggloFile("NOISE_A_R_LD.shp", "R", "A", "LD"),
    #         AggloFile("NOISE_A_R_LN.shp", "R", "A", "LN"),
    #         AggloFile("NOISE_C_F_LD.shp", "F", "C", "LD"),
    #         AggloFile("NOISE_C_F_LN.shp", "F", "C", "LN"),
    #         AggloFile("NOISE_C_I_LD.shp", "I", "C", "LD"),
    #         AggloFile("NOISE_C_I_LN.shp", "I", "C", "LN"),
    #         AggloFile("NOISE_C_R_LD.shp", "R", "C", "LD"),
    #         AggloFile("NOISE_C_R_LN.shp", "R", "C", "LN"),
    #     ],
    # ),
    AggloTerritory(
        slug="lille-metropole",
        dept="059",
        annee="2021",
        campaign="2021",
        box_folder_id="380409798844",
        legende_from="low_val",
        files=[
            AggloFile("ROUTES_Lden-C.shp", "R", "C", "LD"),
            AggloFile("ROUTES_Lden-A.shp", "R", "A", "LD"),
            AggloFile("ROUTES_Ln-C.shp", "R", "C", "LN"),
            AggloFile("ROUTES_Ln-A.shp", "R", "A", "LN"),
            AggloFile("MEL-TypeA_Lden.shp", "F", "A", "LD"),
            AggloFile("MEL-TypeA_Ln.shp", "F", "A", "LN"),
            AggloFile("ICPE-Lden-A_MEL.shp", "I", "A", "LD"),
            AggloFile("ICPE-Ln-A_MEL.shp", "I", "A", "LN"),
        ],
    ),
    AggloTerritory(
        slug="strasbourg-metropole",
        dept="067",
        annee="2021",
        campaign="2022",
        box_folder_id="380247162343",
        legende_from="db_lo",
        files=[
            AggloFile("EMS_2022_Aero_A_Lden.shp", "A", "A", "LD"),
            AggloFile("EMS_2022_Aero_A_Ln.shp", "A", "A", "LN"),
            AggloFile("EMS_2022_Aero_C_Lden.shp", "A", "C", "LD"),
            AggloFile("EMS_2022_Aero_C_Ln.shp", "A", "C", "LN"),
            AggloFile("EMS_2022_Fer_A_Lden.shp", "F", "A", "LD"),
            AggloFile("EMS_2022_Fer_A_Ln.shp", "F", "A", "LN"),
            AggloFile("EMS_2022_Fer_C_Lden.shp", "F", "C", "LD"),
            AggloFile("EMS_2022_Fer_C_Ln.shp", "F", "C", "LN"),
            AggloFile("EMS_2022_ICPE_A_Lden.shp", "I", "A", "LD"),
            AggloFile("EMS_2022_ICPE_A_Ln.shp", "I", "A", "LN"),
            AggloFile("EMS_2022_ICPE_C_Lden.shp", "I", "C", "LD"),
            AggloFile("EMS_2022_ICPE_C_Ln.shp", "I", "C", "LN"),
            AggloFile("EMS_2022_Route_A_Lden.shp", "R", "A", "LD"),
            AggloFile("EMS_2022_Route_A_Ln.shp", "R", "A", "LN"),
            AggloFile("EMS_2022_Route_C_Lden.shp", "R", "C", "LD"),
            AggloFile("EMS_2022_Route_C_Ln.shp", "R", "C", "LN"),
        ],
    ),
]
