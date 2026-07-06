from sqlalchemy import Column, Integer, String
from geoalchemy2 import Geometry
from ..database import Base


class NoiseZoneItem(Base):
    """Model representing noise zone data items"""
    __tablename__ = "noisezone"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_slug = Column(String)
    geometry = Column(Geometry('GEOMETRY', srid=4326))
