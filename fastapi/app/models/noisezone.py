from sqlalchemy import Column, Integer, String, Text, Enum
from geoalchemy2 import Geometry
from ..database import Base
import enum


class ZoneLabel(str, enum.Enum):
    """Enum for noise zone labels"""
    QUIET_ZONE = "Zone de calme"
    NOISE_ZONE = "Zone soumise au bruit"


class NoiseZoneItem(Base):
    """Model representing noise zone data items"""
    __tablename__ = "noisezone"
    
    id = Column(Integer, primary_key=True, index=True)
    label = Column(Enum(ZoneLabel), nullable=False)
    alert = Column(String)
    geometry = Column(Geometry('GEOMETRY', srid=4326))
