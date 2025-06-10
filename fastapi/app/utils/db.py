from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, cast
from sqlalchemy.types import Text
from ..models import (NoiseMapItem, SoundClassificationItem, PebItem)
import logging
import math
import yaml
import json
from pathlib import Path


def load_config():
    with open(Path(__file__).resolve().parent.parent / "references" / "globals.yaml", "r") as f:
        return yaml.safe_load(f)


CONFIG = load_config()

logger = logging.getLogger('uvicorn.error')


def determine_cardinality(safe_centroid, intersection_centroid):
    safe_x, safe_y = safe_centroid
    int_x, int_y = intersection_centroid

    dx = int_x - safe_x
    dy = int_y - safe_y

    angle = math.degrees(math.atan2(dy, dx))

    angle = (angle + 360) % 360

    if 22.5 <= angle < 67.5:
        return "NE"
    elif 67.5 <= angle < 112.5:
        return "N"
    elif 112.5 <= angle < 157.5:
        return "NW"
    elif 157.5 <= angle < 202.5:
        return "W"
    elif 202.5 <= angle < 247.5:
        return "SW"
    elif 247.5 <= angle < 292.5:
        return "S"
    elif 292.5 <= angle < 337.5:
        return "SE"
    else:
        return "E"


def query_noisemap_intersecting_features(db: Session, wkt_geometry: str, codedept: str) -> List[Dict[str, Any]]:
    """
    Query the database for features that intersect with the given WKT geometry.
    Uses the NoiseMapItem model to query the database.
    Merge similar sources, calculate intersection area and determine cardinality.
    """
    try:
        safe_geom = func.ST_Buffer(func.ST_GeomFromText(wkt_geometry, 4326), 0)
        safe_geom_area = db.query(func.ST_Area(safe_geom)).scalar()
        safe_centroid = db.query(func.ST_X(func.ST_Centroid(safe_geom)), func.ST_Y(func.ST_Centroid(safe_geom))).first()

        if not safe_geom_area or safe_geom_area == 0:
            raise ValueError("safe_geom area is zero or invalid")

        intersection_geom = func.ST_Intersection(NoiseMapItem.geometry, safe_geom)

        stmt = db.query(
            NoiseMapItem.typeterr,
            NoiseMapItem.typesource,
            NoiseMapItem.indicetype,
            NoiseMapItem.codeinfra,
            NoiseMapItem.legende,
            NoiseMapItem.cbstype,
            func.sum(func.ST_Area(intersection_geom)).label("total_intersection_area"),
            func.ST_X(func.ST_Centroid(func.ST_Union(intersection_geom))).label("union_centroid_x"),
            func.ST_Y(func.ST_Centroid(func.ST_Union(intersection_geom))).label("union_centroid_y"),
            cast(func.ST_AsGeoJSON(func.ST_Intersection(NoiseMapItem.geometry, safe_geom)), Text).label("geometry_intersection")
        ).filter(
            NoiseMapItem.codedept == codedept,
            func.ST_Intersects(NoiseMapItem.geometry, safe_geom)
        ).group_by(
            NoiseMapItem.typeterr,
            NoiseMapItem.typesource,
            NoiseMapItem.indicetype,
            NoiseMapItem.codeinfra,
            NoiseMapItem.legende,
            NoiseMapItem.cbstype,
            intersection_geom
        )

        result = []
        threshold = CONFIG.get("intersection_minimum_percentage_required", 0.05)
        for r in stmt.all():
            percent_impacted = round(r.total_intersection_area / safe_geom_area, 2)
            geometry_parsed = json.loads(r.geometry_intersection)
            geometry_intersection = geometry_parsed["coordinates"]
            if percent_impacted > threshold and r.union_centroid_x and r.union_centroid_y:
                result.append({
                    "typeterr": r.typeterr,
                    "typesource": r.typesource,
                    "indicetype": r.indicetype,
                    "cbstype": r.cbstype,
                    "legende": r.legende,
                    "codeinfra": r.codeinfra,
                    "geometry_intersection": geometry_intersection,
                    "percent_impacted": percent_impacted,
                    "direction": determine_cardinality(safe_centroid, (r.union_centroid_x, r.union_centroid_y))
                })

        return result

    except Exception as e:
        logger.error(f"Database error in noisemap query : {str(e)}")
        raise


def query_soundclassification_intersecting_features(db: Session, wkt_geometry: str) -> List[Dict[str, Any]]:
    """
    Query the database for sound classification features that intersect with the given WKT geometry.
    Uses the SoundClassificationItem model to query the database.
    """
    try:
        geom_4326 = func.ST_Buffer(func.ST_GeomFromText(wkt_geometry, 4326), 0)
        geom_2154 = func.ST_Transform(geom_4326, 2154)

        stmt = db.query(
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
        safe_geom = func.ST_Buffer(func.ST_GeomFromText(wkt_geometry, 4326), 0)
        safe_geom_area = db.query(func.ST_Area(safe_geom)).scalar()

        if not safe_geom_area or safe_geom_area == 0:
            raise ValueError("safe_geom area is zero or invalid")

        intersection_geom = func.ST_Intersection(PebItem.geometry, safe_geom)

        stmt = db.query(
            PebItem.zone,
            PebItem.legende,
            PebItem.nom,
            PebItem.ref_doc,
            func.sum(func.ST_Area(intersection_geom)).label("intersection_area")
        ).filter(
            func.ST_Intersects(
                PebItem.geometry,
                safe_geom
            )
        ).group_by(
            PebItem.zone,
            PebItem.legende,
            PebItem.nom,
            PebItem.ref_doc
        )

        result = []
        for r in stmt.all():
            percent_impacted = round(r.intersection_area / safe_geom_area, 2)
            result.append({
                "zone": r.zone,
                "legende": r.legende,
                "nom": r.nom,
                "ref_doc": r.ref_doc,
                "percent_impacted": percent_impacted
            })

        return result

    except Exception as e:
        logger.error(f"Database error in peb query: {str(e)}")
        raise