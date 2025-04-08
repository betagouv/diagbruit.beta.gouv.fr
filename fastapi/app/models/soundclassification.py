from sqlalchemy import Column, Integer, String, Float
from geoalchemy2 import Geometry
from ..database import Base


class SoundClassificationItem(Base):
    """Model representing classified sound buffer zones"""
    __tablename__ = "soundclassification"
    
    pk = Column(Integer, primary_key=True, index=True, autoincrement=True)
    geometry = Column(Geometry('POLYGON', srid=4326))
    source = Column(String)
    typesource = Column(String(1), index=True)
    codeinfra = Column(String)
    buffer = Column(Float)
    sound_category = Column(Integer)
