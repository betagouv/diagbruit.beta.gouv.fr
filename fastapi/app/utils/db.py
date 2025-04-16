from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import (NoiseMapItem, SoundClassificationItem, PebItem)
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
        geom_4326 = func.ST_GeomFromText(wkt_geometry, 4326)
        geom_2154 = func.ST_Transform(geom_4326, 2154)

        stmt = db.query(
            SoundClassificationItem.pk,
            SoundClassificationItem.source,
            SoundClassificationItem.typesource,
            SoundClassificationItem.codeinfra,
            SoundClassificationItem.sound_category,
            func.round(
                func.ST_Distance(
                    SoundClassificationItem.source_geometry,
                    geom_2154
                )
            ).label("distance")
        ).filter(
            func.ST_Intersects(
                SoundClassificationItem.geometry,
                geom_4326
            )
        ).order_by("distance")

        return [
            {
                "pk": r.pk,
                "source": r.source,
                "typesource": r.typesource,
                "codeinfra": r.codeinfra,
                "sound_category": r.sound_category,
                "distance": r.distance
            }
            for r in stmt.all()
        ]

    except Exception as e:
        logger.error(f"Database error in sound classification query: {str(e)}")
        raise

def query_peb_intersecting_features(db: Session, wkt_geometry: str) -> List[Dict[str, Any]]:
    """
    Query the database for sound classification features that intersect with the given WKT geometry.
    Uses the SoundClassificationItem model to query the database.
    """
    try:
        stmt = db.query(
            PebItem
        ).filter(
            func.ST_Intersects(
                PebItem.geometry,
                func.ST_GeomFromText(wkt_geometry, 4326)
            )
        )

        return [
            {
                "pk": r.pk,
                "zone": r.zone,
                "legende": r.legende,
                "nom": r.nom,
                "ref_doc": r.ref_doc
            }
            for r in stmt.all()
        ]

    except Exception as e:
        logger.error(f"Database error in peb query: {str(e)}")
        raise