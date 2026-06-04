from sqlalchemy import Column, Integer, String, Float, Boolean
from geoalchemy2 import Geometry
from ..database import Base


class BdnbItem(Base):
    """Model representing clean and validated BDNB building data"""
    __tablename__ = "bdnb"
    
    pk = Column(Integer, primary_key=True, index=True, autoincrement=True)
    fid = Column(Float)
    polygon_id = Column(String, index=True)
    batiment_c = Column(String, index=True)
    batiment_g = Column(String)
    code_depar = Column(String)
    code_iris = Column(String)
    code_commu = Column(String)
    s_geom_cst = Column(Float)
    hauteur = Column(Float)
    altitude_s = Column(Float)
    geometry = Column(Geometry("POLYGON", srid=4326))
    area_m2 = Column(Float)
    srid = Column(Integer)
    original_is_valid = Column(String)
    original_validity_reason = Column(String)
    is_valid_now = Column(String)
    geometry_type = Column(String)