from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class SoundclassificationSource:
    """One transport-mode source for a soundclassification territory.

    file: shapefile stem (or name) inside the Box folder that belongs to this mode.

    The *_from overrides let you point each semantic field at a differently-named
    shapefile column when the territory's data doesn't follow the mode default.
    Leave them as None to use the defaults defined in _COLUMNS_BY_MODE.
    """

    file: str  # shapefile stem in the Box folder, e.g. "FER_033" or "FER_033.shp"
    mode: str  # "routier" | "fer" | "lgv" | "tramway"
    label_from: str | None = None
    acoustic_category_from: str | None = None
    acoustic_buffer_from: str | None = None
    segment_from: str | None = None  # routier only
    numero_from: str | None = None  # routier only

    @property
    def db_table(self) -> str:
        return f"raw_soundclassification_{self.mode}"

    @property
    def file_stem(self) -> str:
        return Path(self.file).stem


@dataclass(frozen=True)
class SoundclassificationTerritory:
    dept: str
    campaign: str
    box_id: str
    sources: tuple[SoundclassificationSource, ...]


SOUNDCLASSIFICATION_TERRITORIES: list[SoundclassificationTerritory] = [
    SoundclassificationTerritory(
        dept="033",
        campaign="2022",
        box_id="384756452625",
        sources=(
            SoundclassificationSource("Class_sonore_DDTM33_SNCF.shp", mode="fer",
                                      label_from="ligne", acoustic_category_from="rang",
                                      acoustic_buffer_from="sect_affec"),
            SoundclassificationSource("Class_sonore_DDTM33_routier.shp", mode="routier",
                                      numero_from="numero", acoustic_category_from="cat_bruit",
                                      acoustic_buffer_from="larg_secte"),
            SoundclassificationSource("Class_sonore_DDTM33_LGV-SEA_LISEA.shp", mode="lgv",
                                      label_from="toponyme",
                                      acoustic_category_from="cat",
                                      acoustic_buffer_from="larg_secte"),
            SoundclassificationSource("Class_sonore_DDTM33_tramway.shp", mode="tramway",
                                      label_from="id",
                                      acoustic_category_from="categorie",
                                      acoustic_buffer_from="larg_secte"),
        ),
    ),
    SoundclassificationTerritory(
        dept="067",
        campaign="2022",
        box_id="384765500903",
        sources=(
            SoundclassificationSource("troncon_fer_valide_67.shp", mode="fer", 
                                      label_from="nomroute", acoustic_category_from="categorie", 
                                      acoustic_buffer_from="largeur"),
            SoundclassificationSource("CSV_Routes_67_2023.shp", mode="routier", 
                                      numero_from="nomtroncon", acoustic_category_from="categorieb", 
                                      acoustic_buffer_from="largeursec"),
        ),
    ),
    SoundclassificationTerritory(
        dept="059",
        campaign="2022",
        box_id="384762438911",
        sources=(
            SoundclassificationSource("troncon_fer_valide_59.shp", mode="fer", 
                                      label_from="nomroute", acoustic_category_from="categorie", 
                                      acoustic_buffer_from="largeur"),
            SoundclassificationSource("troncons59.shp", mode="routier",
                                      numero_from="nomtroncon",
                                      acoustic_category_from="cat_bruit",
                                      acoustic_buffer_from="larg_sect"),
        ),
    ),
    SoundclassificationTerritory(
        dept="019",
        campaign="2023",
        box_id="384762503396",
        sources=(
            SoundclassificationSource("L_CLASST_SONORE_SNCF_2023_L_019.shp", mode="fer", 
                                      label_from="code_ligne", acoustic_category_from="cat_arrete"),
            SoundclassificationSource("L_CLASST_SONORE_2023_L_019.shp", mode="routier",
                                      numero_from="nomtroncon",
                                      acoustic_category_from="cat_bruit",
                                      acoustic_buffer_from="large_sect"),
        ),
    ),    
    SoundclassificationTerritory(
        dept="044",
        campaign="2022",
        box_id="386385469534",
        sources=(
            SoundclassificationSource("N_CLASS_SONORE_FER_L_044.shp", mode="fer", 
                                      label_from="nomroute", acoustic_category_from="categorie",
                                      acoustic_buffer_from="largeur"),
            SoundclassificationSource("N_CLASS_SONORE_RTE_L_044.shp", mode="routier",
                                      numero_from="nomroute",
                                      acoustic_category_from="categorie",
                                      acoustic_buffer_from="largeur"),
        ),
    ),    
    SoundclassificationTerritory(
        dept="035",
        campaign="2022",
        box_id="384766914314",
        sources=(
            SoundclassificationSource("SNCF_CSV_BPL_2018.shp", mode="fer",
                                      label_from="code_ligne", acoustic_category_from="cat_2037"),
            SoundclassificationSource("L_CLASS_SON_VOIES_L_035_AXES.shp", mode="routier",
                                      numero_from="nom_tronco", acoustic_category_from="categorie_"),
        ),
    ),
    SoundclassificationTerritory(
        dept="013",
        campaign="2022",
        box_id="384761127851",
        sources=(
            SoundclassificationSource("fer.shp", mode="fer",
                                      label_from="codinfra", acoustic_category_from="categ_cls"),
            SoundclassificationSource("routier.shp", mode="routier",
                                      numero_from="nom_du_tro", acoustic_category_from="catégorie",
                                      acoustic_buffer_from="largeur_ma"),
        ),
    ),
    SoundclassificationTerritory(
        dept="053",
        campaign="2019",
        box_id="398027450240",
        sources=(
            SoundclassificationSource("classement_sonore_fer_2019.shp", mode="fer",
                                      label_from="nom_voie", acoustic_category_from="categorie"),
            SoundclassificationSource("classement_sonore_route_2025.shp", mode="routier",
                                      numero_from="nomtroncon", acoustic_category_from="categorie",
                                      acoustic_buffer_from="tampon"),
        ),
    ),
]
