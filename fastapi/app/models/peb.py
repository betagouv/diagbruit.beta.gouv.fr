from sqlalchemy import Column, Integer, String, Float
from geoalchemy2 import Geometry
from ..database import Base


class PebItem(Base):
    """Model representing clean and validated PEB polygons"""
    __tablename__ = "peb"
    pk = Column(Integer, primary_key=True, index=True, autoincrement=True)
    zone = Column(String)
    legende = Column(Float)
    indldenext = Column(String)
    indldenint = Column(String)
    code_oaci = Column(String)
    nom = Column(String)
    date_arret = Column(String)
    producteur = Column(String)
    date_maj = Column(String)
    ref_doc = Column(String)
    id_map = Column(String)
    polygon_id = Column(String, index=True)
    geometry = Column(Geometry("POLYGON", srid=4326))
    area_m2 = Column(Float)
    srid = Column(Integer)
    original_is_valid = Column(String)
    original_validity_reason = Column(String)
    is_valid_now = Column(String)
    geometry_type = Column(String)
