from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.noisemap import NoiseMapItem
from ..models.soundclassification import SoundClassificationItem
from sqlalchemy.dialects import postgresql
import logging

logger = logging.getLogger('uvicorn.error')


def query_noisemap_intersecting_features(db: Session, wkt_geometry: str) -> List[Dict[str, Any]]:
    """
    Query the database for features that intersect with the given WKT geometry.
    Uses the NoiseMapItem model to query the database.
    """
    try:
        stmt = db.query(
            NoiseMapItem
        ).filter(
            func.ST_Intersects(
                NoiseMapItem.geometry,
                func.ST_GeomFromText(wkt_geometry, 4326)
            )
        )

        return [
            {
                "pk": r.pk,
                "typeterr": r.typeterr,
                "typesource": r.typesource,
                "indicetype": r.indicetype,
                "codeinfra": r.codeinfra,
                "legende": r.legende,
                "cbstype": r.cbstype
            }
            for r in stmt.all()
        ]

    except Exception as e:
        logger.error(f"Database error in noisemap query : {str(e)}")
        raise


def query_soundclassification_intersecting_features(db: Session, wkt_geometry: str) -> List[Dict[str, Any]]:
    """
    Query the database for sound classification features that intersect with the given WKT geometry.
    Uses the SoundClassificationItem model to query the database.
    """
    try:
        stmt = db.query(
            SoundClassificationItem
        ).filter(
            func.ST_Intersects(
                SoundClassificationItem.geometry,
                func.ST_GeomFromText(wkt_geometry, 4326)
            )
        )

        return [
            {
                "pk": r.pk,
                "source": r.source,
                "typesource": r.typesource,
                "codeinfra": r.codeinfra,
                "sound_category": r.sound_category,
                "source_geometry": r.source_geometry
            }
            for r in stmt.all()
        ]

    except Exception as e:
        logger.error(f"Database error in sound classification query: {str(e)}")
        raise