from sqlalchemy import Column, Integer, String, Text
from geoalchemy2 import Geometry
from ..database import Base


class NoiseSourceItem(Base):
    """Model representing noise source data items"""
    __tablename__ = "noisesource"
    
    pk = Column(Integer, primary_key=True, index=True)
    label = Column(Text)
    geometry = Column(Geometry('GEOMETRY', srid=4326))
    category_slug = Column(Text, index=True)
    codedept = Column(String(3), index=True)
