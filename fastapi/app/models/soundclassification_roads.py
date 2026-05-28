from sqlalchemy import Column, Integer, String
from geoalchemy2 import Geometry
from ..database import Base


class SoundClassificationRoadsItem(Base):
    """Model representing sound classification roads with merged multilinestrings grouped by label"""
    __tablename__ = "soundclassification_roads"

    pk = Column(Integer, primary_key=True, index=True)
    source = Column(String)
    kind = Column(String(1), index=True)
    label = Column(String, index=True)
    codedept = Column(String)
    geometry = Column(Geometry('MULTILINESTRING', srid=4326))