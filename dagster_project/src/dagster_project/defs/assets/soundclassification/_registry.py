from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class SoundclassificationSource:
    """One transport-mode source for a soundclassification territory.

    file: shapefile stem (or name) inside the Box folder that belongs to this mode.
    """

    file: str  # shapefile stem in the Box folder, e.g. "FER_033" or "FER_033.shp"
    mode: str  # "routier" | "fer" | "lgv" | "tramway"

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
]
