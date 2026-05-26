from sqlalchemy import Column, Integer, String, Float
from geoalchemy2 import Geometry
from ..database import Base


class PebItem(Base):
    """Model representing clean and validated PEB polygons"""
    __tablename__ = "peb"
    pk = Column(Integer, primary_key=True, index=True, autoincrement=True)
    acoustic_zone = Column(String)
    acoustic_db_value = Column(Float)
    label = Column(String)
    campaign = Column(String)
    campaign_url = Column(String)
    polygon_id = Column(String, index=True)
    geometry = Column(Geometry("POLYGON", srid=4326))
