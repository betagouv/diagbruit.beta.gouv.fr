from sqlalchemy import Column, Integer, String
from geoalchemy2 import Geometry
from ..database import Base


class NoiseMapItem(Base):
    """Model representing noise map data items"""
    __tablename__ = "noisemap"
    
    pk = Column(Integer, primary_key=True, index=True, autoincrement=True)
    geometry = Column(Geometry('POLYGON', srid=4326))
    idzonbruit = Column(String, index=True)
    idcbs = Column(String, index=True)
    uueid = Column(String)
    annee = Column(String(4)) 
    codedept = Column(String(3))
    typeterr = Column(String)
    producteur = Column(String(9))
    codeinfra = Column(String)
    typesource = Column(String)
    cbstype = Column(String)
    zonedef = Column(String(2))
    legende = Column(String)
    indicetype = Column(String)
    validedeb = Column(String)
    validefin = Column(String)