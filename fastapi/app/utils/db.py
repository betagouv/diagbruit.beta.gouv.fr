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
            NoiseMapItem,
            func.ST_AsText(NoiseMapItem.geometry).label('geometry_wkt')
        ).filter(
            func.ST_Intersects(
                NoiseMapItem.geometry,
                func.ST_GeomFromText(wkt_geometry, 4326)
            )
        )

        results = stmt.all()

        features = []
        for item, geom_wkt in results:
            feature = {c.name: getattr(item, c.name) for c in item.__table__.columns if c.name != 'geom'}
            feature['geometry_wkt'] = geom_wkt
            features.append(feature)

        return features

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
            SoundClassificationItem,
            func.ST_AsText(SoundClassificationItem.geometry).label('geometry_wkt')
        ).filter(
            func.ST_Intersects(
                SoundClassificationItem.geometry,
                func.ST_GeomFromText(wkt_geometry, 4326)
            )
        )

        results = stmt.all()

        features = []
        for item, geom_wkt in results:
            feature = {c.name: getattr(item, c.name) for c in item.__table__.columns if c.name != 'geom'}
            feature['geometry_wkt'] = geom_wkt
            features.append(feature)

        return features

    except Exception as e:
        logger.error(f"Database error in sound classification query: {str(e)}")
        raise