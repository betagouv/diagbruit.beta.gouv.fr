from sqlalchemy import Column, Integer, String, JSON, DateTime, Index
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from ..database import Base


class Result(Base):
    """Model for storing diagnostic results"""
    __tablename__ = "result"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code_insee = Column(String, nullable=False)
    section = Column(String, nullable=False)
    numero = Column(String, nullable=False)
    geometry = Column(Geometry('MULTIPOLYGON', srid=4326), nullable=False)
    diagnostic_result = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        Index('idx_parcelle_unique', 'code_insee', 'section', 'numero', unique=True),
    )