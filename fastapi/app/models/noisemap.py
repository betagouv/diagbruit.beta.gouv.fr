from sqlalchemy import Column, Integer, String, Float
from geoalchemy2 import Geometry
from ..database import Base


class NoiseMapItem(Base):
    """Model representing noise map data items"""
    __tablename__ = "noisemap"

    pk = Column(Integer, primary_key=True, index=True, autoincrement=True)
    geometry = Column(Geometry('POLYGON', srid=4326))
    codedept = Column(String(3))
    acoustic_producer_kind = Column(String)
    codeinfra = Column(String)
    kind = Column(String)
    acoustic_noisemap_kind = Column(String)
    acoustic_db_value = Column(Float)
    acoustic_time_range = Column(String)
