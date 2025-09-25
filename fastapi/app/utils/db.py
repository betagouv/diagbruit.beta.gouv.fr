from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, func, cast, case
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.types import Text
from geoalchemy2 import WKTElement
from ..models import (NoiseMapItem, SoundClassificationItem, SoundClassificationRoadsItem, PebItem, TopoItem,)
from ..models.result import Result
from ..database import SessionLocal
from ..utils.geometry import create_multipolygon_from_coordinates
from ..version import get_api_version
import asyncio
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


def query_topo_buildings_between(db: Session, wkt_geometry: str, source_point_geom, geometry_source) -> List[Dict[str, Any]]:
    """
    Query topo buildings that are between the land (wkt_geometry) and the road (source_point_geom).
    Uses ST_MakeLine to create a line between centroids and finds buildings intersecting this corridor.
    """
    try:
        land_geom = func.ST_GeomFromText(wkt_geometry, 4326)

        # Géométries d'entrée
        land_4326 = func.ST_GeomFromText(wkt_geometry, 4326)
        source_4326 = func.ST_Transform(source_point_geom, 4326)  # PB (point source)
        road_2154 = func.ST_Transform(geometry_source, 2154)  # ta "droite B" (LINE/MULTILINE) en 2154

        # Reprojeter en 2154 (métrique) pour les calculs
        land_2154 = func.ST_Transform(land_4326, 2154)
        src_2154 = func.ST_Transform(source_4326, 2154)

        # Segment A (PA -> PB)
        closest_seg_2154 = func.ST_ShortestLine(land_2154, src_2154)
        pa_2154 = func.ST_StartPoint(closest_seg_2154)
        pb_2154 = func.ST_EndPoint(closest_seg_2154)

        # Angle +5° autour de PA
        az = func.ST_Azimuth(pa_2154, pb_2154)  # radians
        dir_rot = az + func.radians(5.0)

        # On fabrique un "point très loin" dans la direction rotée (demi-droite)
        L = 1_000_000.0
        far_x = func.ST_X(pa_2154) + L * func.sin(dir_rot)
        far_y = func.ST_Y(pa_2154) + L * func.cos(dir_rot)
        far_pt = func.ST_SetSRID(func.ST_MakePoint(far_x, far_y), 2154)

        # Demi-droite C (PA -> far_pt)
        lineC = func.ST_MakeLine(pa_2154, far_pt)

        # Intersection avec la route B
        raw_inter = func.ST_Intersection(lineC, road_2154)
        gtype = func.GeometryType(raw_inter)

        # Q = point d'intersection (robuste si colinéarité)
        q_2154 = case(
            (gtype == 'POINT', raw_inter),
            ((gtype.in_(['LINESTRING', 'MULTILINESTRING', 'GEOMETRYCOLLECTION'])),
             func.ST_ClosestPoint(raw_inter, pa_2154)),
            else_=None
        )

        # Construire le ring sans ARRAY[] : MakeLine(pa,pb) + AddPoint(..., q) + AddPoint(..., pa)
        ring1 = func.ST_MakeLine(pa_2154, pb_2154)  # PA -> PB
        ring2 = func.ST_AddPoint(ring1, q_2154)  # PA -> PB -> Q
        ring3 = func.ST_AddPoint(ring2, pa_2154)  # PA -> PB -> Q -> PA (fermé)

        triangle_2154 = func.ST_MakePolygon(ring3)
        triangle_4326 = func.ST_Transform(triangle_2154, 4326)

        stmt = select(
            cast(func.ST_AsText(land_geom), Text).label("land"),
            cast(func.ST_AsText(geometry_source), Text).label("road"),
            cast(func.ST_AsText(func.ST_Transform(closest_seg_2154, 4326)), Text).label("closest_line"),
            cast(func.ST_AsText(triangle_2154), Text).label("triangle_2154_wkt"),
            cast(func.ST_AsText(triangle_4326), Text).label("triangle_4326_wkt"),
            func.ST_AsGeoJSON(triangle_4326).label("triangle_geojson")
        )

        row = db.execute(stmt).first()
        print('Land:', row.land)
        print('Road:', row.road)
        print("Closest line (WKT,4326):", row.closest_line)
        print("Triangle (WKT,2154):", row.triangle_2154_wkt)
        print("Triangle (WKT,4326):", row.triangle_4326_wkt)
        print("Triangle (GeoJSON):", row.triangle_geojson)
        # stmt = db.query(
        #     TopoItem.fid,
        #     TopoItem.polygon_id,
        #     TopoItem.batiment_c,
        #     TopoItem.hauteur,
        #     TopoItem.area_m2,
        #     cast(func.ST_AsGeoJSON(TopoItem.geometry), Text).label("geometry")
        # ).filter(
        #     func.ST_Intersects(TopoItem.geometry, corridor_geom_4326),
        #     TopoItem.is_valid_now == 'true'
        # )
        #
        # result = []
        # for r in stmt.all():
        #     try:
        #         geometry_parsed = json.loads(r.geometry)
        #         geometry_coords = geometry_parsed["coordinates"]
        #     except Exception as parse_err:
        #         logger.warning(f"Could not parse topo geometry: {parse_err}")
        #         geometry_coords = None
        #
        #     result.append({
        #         "fid": r.fid,
        #         "polygon_id": r.polygon_id,
        #         "batiment_c": r.batiment_c,
        #         "hauteur": r.hauteur,
        #         "area_m2": r.area_m2,
        #         "geometry": geometry_coords
        #     })
            
        return []
        
    except Exception as e:
        logger.error(f"Database error in topo buildings query: {str(e)}")
        return []


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


def query_noisemap_intersecting_features(db: Session, wkt_geometry: str, codedept: str) -> Dict[str, Any]:
    """
    Query the database for features that intersect with the given WKT geometry.
    Uses the NoiseMapItem model to query the database.
    Merge similar sources, calculate intersection area and determine cardinality.
    """
    try:
        safe_geom = func.ST_Buffer(func.ST_GeomFromText(wkt_geometry, 4326), 0)
        safe_geom_area = db.query(func.ST_Area(func.Geography(safe_geom))).scalar()
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
            func.sum(func.ST_Area(func.Geography(intersection_geom))).label("total_intersection_area_m2"),
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
            percent_impacted = round((r.total_intersection_area_m2 or 0) / safe_geom_area, 2)
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

        rest_expr = func.ST_Multi(
            func.ST_CollectionExtract(
                func.ST_Difference(
                    safe_geom,
                    func.COALESCE(
                        func.ST_Union(
                            func.ST_Intersection(
                                NoiseMapItem.geometry, 
                                safe_geom
                            )
                        ).filter(NoiseMapItem.indicetype == 'LD'),
                        func.ST_GeomFromText('GEOMETRYCOLLECTION EMPTY', 4326)
                    )
                ),
                3
            )
        )

        rest_row = db.query(
            func.ST_Area(func.Geography(rest_expr)).label("rest_area_m2")
        ).filter(
            NoiseMapItem.codedept == codedept,
            func.ST_Intersects(NoiseMapItem.geometry, safe_geom)
        ).one()

        percent_unimpacted = round((rest_row.rest_area_m2 or 0) / safe_geom_area, 2)

        return {
            "intersections": result,
            "percent_unimpacted": percent_unimpacted
        }

    except Exception as e:
        logger.error(f"Database error in noisemap query : {str(e)}")
        raise


def query_soundclassification_intersecting_features(db: Session, wkt_geometry: str) -> Dict[str, Any]:
    """
    Query the database for sound classification features that intersect with the given WKT geometry.
    Includes percent_impacted and geometry_intersection.
    """
    try:
        geom_4326 = func.ST_Buffer(func.ST_GeomFromText(wkt_geometry, 4326), 0)
        geom_2154 = func.ST_Transform(geom_4326, 2154)

        safe_geom_area = db.query(func.ST_Area(geom_4326)).scalar()
        if not safe_geom_area or safe_geom_area == 0:
            raise ValueError("safe_geom area is zero or invalid")

        intersection_geom = func.ST_Intersection(SoundClassificationItem.geometry, geom_4326)

        stmt = db.query(
            SoundClassificationItem.source,
            SoundClassificationItem.typesource,
            SoundClassificationItem.codeinfra,
            SoundClassificationItem.sound_category,
            cast(func.ST_AsGeoJSON(SoundClassificationRoadsItem.geometry), Text).label("geometry_source"),
            cast(
                func.ST_AsGeoJSON(
                    func.ST_Transform(
                        func.ST_ClosestPoint(SoundClassificationRoadsItem.geometry, geom_2154),
                        4326
                    )
                ),
                Text
            ).label("geometry_source_point"),
            func.round(
                func.ST_Distance(
                    SoundClassificationRoadsItem.geometry,
                    geom_2154
                )
            ).label("distance"),
            func.sum(func.ST_Area(intersection_geom)).label("intersection_area"),
            cast(func.ST_AsGeoJSON(intersection_geom), Text).label("geometry_intersection")
        ).join(
            SoundClassificationRoadsItem,
            SoundClassificationItem.codeinfra == SoundClassificationRoadsItem.codeinfra
        ).filter(
            func.ST_Intersects(SoundClassificationItem.geometry, geom_4326)
        ).group_by(
            SoundClassificationItem.source,
            SoundClassificationItem.typesource,
            SoundClassificationItem.codeinfra,
            SoundClassificationItem.sound_category,
            SoundClassificationRoadsItem.geometry,
            intersection_geom
        ).order_by("distance")

        result = []
        for r in stmt.all():
            percent_impacted = round(r.intersection_area / safe_geom_area, 2) if r.intersection_area else 0.0

            try:
                geometry_parsed = json.loads(r.geometry_intersection)
                geometry_intersection = geometry_parsed["coordinates"]
            except Exception as parse_err:
                logger.warning(f"Could not parse geometry_intersection: {parse_err}")
                geometry_intersection = None

            try:
                geometry_source_point_parsed = json.loads(r.geometry_source_point)
                geometry_source_point = geometry_source_point_parsed["coordinates"]
                source_point_geom = func.ST_GeomFromText(f"POINT({geometry_source_point[0]} {geometry_source_point[1]})", 4326)
            except Exception as parse_err:
                logger.warning(f"Could not parse source_point: {parse_err}")
                geometry_source_point = None
                source_point_geom = None

            topo_buildings = []
            if source_point_geom is not None:
                topo_buildings = query_topo_buildings_between(db, wkt_geometry, source_point_geom, r.geometry_source)

            result.append({
                "source": r.source,
                "typesource": r.typesource,
                "codeinfra": r.codeinfra,
                "sound_category": r.sound_category,
                "distance": r.distance,
                "percent_impacted": percent_impacted,
                "geometry_source_point": geometry_source_point,
                "geometry_intersection": geometry_intersection,
                "topo": topo_buildings
            })

        return {
            "intersections": result
        }

    except Exception as e:
        logger.error(f"Database error in sound classification query: {str(e)}")
        raise


def query_peb_intersecting_features(db: Session, wkt_geometry: str) -> Dict[str, Any]:
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

        return {
            "intersections": result
        }

    except Exception as e:
        logger.error(f"Database error in peb query: {str(e)}")
        raise


async def upsert_diagnostic_result(
    code_insee: str,
    section: str,
    numero: str,
    geometry: List,
    score: int,
    diagnostic_result: Dict[str, Any]
):
    """
    Asynchronously save diagnostic result to database.
    If parcelle already exists, update only the diagnostic_result.
    """
    db = SessionLocal()
    loop = asyncio.get_running_loop()
    
    try:
        polygon_wkt = create_multipolygon_from_coordinates(geometry)
        geometry_element = WKTElement(polygon_wkt, srid=4326)
        
        stmt = insert(Result).values(
            code_insee=code_insee,
            section=section,
            numero=numero,
            geometry=geometry_element,
            score=score,
            diagnostic_result=diagnostic_result,
            api_version=get_api_version()
        )
        
        stmt = stmt.on_conflict_do_update(
            index_elements=['code_insee', 'section', 'numero'],
            set_={
                'score': stmt.excluded.score,
                'diagnostic_result': stmt.excluded.diagnostic_result,
                'api_version': stmt.excluded.api_version,
                'updated_at': stmt.excluded.updated_at
            }
        )
        
        await loop.run_in_executor(None, lambda: db.execute(stmt))
        await loop.run_in_executor(None, db.commit)
        
    except Exception as e:
        await loop.run_in_executor(None, db.rollback)
        logger.error(f"Error saving diagnostic result for {code_insee}-{section}-{numero}: {str(e)}")
        raise
    finally:
        await loop.run_in_executor(None, db.close)
