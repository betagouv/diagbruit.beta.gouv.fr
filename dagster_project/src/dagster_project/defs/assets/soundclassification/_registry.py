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
            SoundclassificationSource("Class_sonore_DDTM33_SNCF.shp", mode="fer"),
            SoundclassificationSource("Class_sonore_DDTM33_routier.shp", mode="routier"),
            SoundclassificationSource("Class_sonore_DDTM33_LGV-SEA_LISEA.shp", mode="lgv"),
            SoundclassificationSource("Class_sonore_DDTM33_tramway.shp", mode="tramway"),
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
                                      acoustic_buffer_from="larg_sect"),
        ),
    ),
]
