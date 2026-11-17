from sqlalchemy import Column, Integer, String, Float
from geoalchemy2 import Geometry
from ..database import Base


class NoiseMapItem(Base):
    """Model representing noise map data items"""
    __tablename__ = "noisemap"

    # NOT unique: dbt subdivides each contour into pieces that all carry their
    # parent's id, so one id maps to N rows. It is declared primary_key only because
    # SQLAlchemy requires one; the table has no PK constraint. Query columns, never
    # the entity — `db.query(NoiseMapItem)` would dedupe by identity and silently
    # drop pieces. Group by this id to recover a whole contour.
    id = Column(Integer, primary_key=True, index=True)
    geometry = Column(Geometry('POLYGON', srid=4326))
    codedept = Column(String(3))
    acoustic_producer_kind = Column(String)
    codeinfra = Column("label", String)
    kind = Column(String)
    acoustic_noisemap_kind = Column(String)
    acoustic_db_value = Column(Float)
    acoustic_time_range = Column(String)
