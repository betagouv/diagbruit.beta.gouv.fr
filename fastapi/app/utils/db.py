from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, func, cast, case, union_all, literal, and_
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.types import Text
from geoalchemy2 import WKTElement
from ..models import (NoiseMapItem, SoundClassificationItem, SoundClassificationRoadsItem, PebItem, TopoItem, NoiseSourceItem, NoiseZoneItem)
from ..models.result import Result
from ..database import SessionLocal
from ..utils.geometry import create_multipolygon_from_coordinates
from ..version import get_api_version
from .sig import (
    base_geoms,
    build_arm_cte,
    union_arms_to_triangles_cte,
    intersecting_triangle_groups_cte,
    angle_view_from_counts,
    determine_cardinality
)
from .acoustic import (correction_from_angle)
import asyncio
import logging
import yaml
import json
import os
import httpx
from pathlib import Path
from typing import Tuple
from sqlalchemy import select
from sqlalchemy.sql.elements import ColumnElement


def load_config():
    with open(Path(__file__).resolve().parent.parent / "references" / "globals.yaml", "r") as f:
        return yaml.safe_load(f)


CONFIG = load_config()

logger = logging.getLogger('uvicorn.error')

def get_soundclassification_intersection_corrections(
    db: "Session",
    wkt_geometry: str,
    source_point_geom: ColumnElement,
    geometry_source: ColumnElement,
    codedept: str
) -> Tuple[int, int]:
    """
    Compute the corrective value (in dB) based on the resulting view angle
    after masking by TopoItem buildings around the source, for:
      - the SHORTEST connecting segment (closest)
      - the LONGEST  connecting segment (farthest)

    Returns (closest_correction_db, farthest_correction_db).
    """

    FULL_ANGLE = 140.0
    SUB_ANGLE  = 5.0
    STEPS = int(FULL_ANGLE / SUB_ANGLE / 2)
    FAR_LEN = 1_000_000.0

    def compute_correction_for(*, pa, pb, az0, name_prefix: str, road_2154) -> int:
        # Build recursive CTEs for left and right arms (triangles in 2154)
        left = build_arm_cte(
            name=f"{name_prefix}_left_tri",
            steps=STEPS, pa=pa, pb=pb, az0=az0,
            road_2154=road_2154, subangle_deg=SUB_ANGLE,
            direction="left", far_length=FAR_LEN
        )
        right = build_arm_cte(
            name=f"{name_prefix}_right_tri",
            steps=STEPS, pa=pa, pb=pb, az0=az0,
            road_2154=road_2154, subangle_deg=SUB_ANGLE,
            direction="right", far_length=FAR_LEN
        )

        # Count total triangles generated (stops early if q becomes NULL)
        triangles = union_arms_to_triangles_cte(left, right)
        total = int(db.execute(select(func.count()).select_from(triangles)).scalar() or 0)

        # Count triangles that intersect at least one TopoItem
        tri_hits = intersecting_triangle_groups_cte(triangles, TopoItem, valid_col="is_valid_now", codedept=codedept)
        intersecting = int(db.execute(select(func.count()).select_from(tri_hits)).scalar() or 0)

        # Angle and dB correction
        angle_view = angle_view_from_counts(FULL_ANGLE, SUB_ANGLE, intersecting)
        correction_db = correction_from_angle(angle_view)

        logger.debug(
            f"[{name_prefix}] Triangles: total={total}, hits={intersecting} | "
            f"view_angle={angle_view:.1f}° -> correction={correction_db} dB"
        )
        return correction_db

    try:
        # Apply 5-meter buffer to the WKT geometry to avoid scanning geometry's building
        buffered_wkt_geom = func.ST_AsText(
            func.ST_Transform(
                func.ST_Buffer(
                    func.ST_Transform(
                        func.ST_GeomFromText(wkt_geometry, 4326),
                        2154
                    ),
                    2
                ),
                4326
            )
        )
        buffered_wkt_geometry = db.execute(select(buffered_wkt_geom)).scalar()
        
        _, _, road_2154, closest_values, farthest_values = base_geoms(
            buffered_wkt_geometry, source_point_geom, geometry_source
        )

        closest_correction_db = compute_correction_for(
            pa=closest_values['pa'],
            pb=closest_values['pb'],
            az0=closest_values['az0'],
            name_prefix="closest",
            road_2154=road_2154
        )

        farthest_correction_db = compute_correction_for(
            pa=farthest_values['pa'],
            pb=farthest_values['pb'],
            az0=farthest_values['az0'],
            name_prefix="farthest",
            road_2154=road_2154
        )

        return (closest_correction_db, farthest_correction_db)

    except Exception as e:
        logger.error(f"Error while computing sound corrections: {str(e)}")
        return (0, 0)



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


def query_soundclassification_intersecting_features(db: Session, wkt_geometry: str, include_isolation: bool, codedept: str = None) -> Dict[str, Any]:
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

        closest_point_2154 = func.ST_ClosestPoint(
            SoundClassificationRoadsItem.geometry,
            geom_2154
        )

        stmt = db.query(
            SoundClassificationItem.source,
            SoundClassificationItem.typesource,
            SoundClassificationItem.codeinfra,
            SoundClassificationItem.sound_category,
            cast(func.ST_AsGeoJSON(SoundClassificationRoadsItem.geometry), Text).label("geometry_source"),
            cast(
                func.ST_AsGeoJSON(
                    func.ST_Transform(closest_point_2154, 4326)
                ),
                Text
            ).label("geometry_source_point"),
            func.round(
                func.ST_Distance(
                    SoundClassificationRoadsItem.geometry,
                    geom_2154
                )
            ).label("min_distance"),
            func.round(
                func.ST_MaxDistance(
                    closest_point_2154,
                    geom_2154
                )
            ).label("max_distance"),
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
        ).order_by("min_distance")

        result = []
        for r in stmt.all():
            closest_correction = None
            farthest_correction = None
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

            if include_isolation and source_point_geom is not None and codedept is not None:
                (closest_correction, farthest_correction) = get_soundclassification_intersection_corrections(db, wkt_geometry, source_point_geom, r.geometry_source, codedept)

            result.append({
                "source": r.source,
                "typesource": r.typesource,
                "codeinfra": r.codeinfra,
                "sound_category": r.sound_category,
                "min_distance": r.min_distance,
                "max_distance": r.max_distance,
                "percent_impacted": percent_impacted,
                "geometry_source_point": geometry_source_point,
                "geometry_intersection": geometry_intersection,
                "closest_correction": closest_correction,
                "farthest_correction": farthest_correction
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
        threshold = CONFIG.get("intersection_minimum_percentage_required", 0.05)
        for r in stmt.all():
            percent_impacted = round(r.intersection_area / safe_geom_area, 2)
            if percent_impacted > threshold:
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


def query_noisesource_intersecting_features(db: Session, wkt_geometry: str, codedept: str = None) -> Dict[str, Any]:
    """
    Query the database for noise source features that intersect with the given WKT geometry.
    
    1. Fetch noise source categories from Strapi API
    2. Find the maximum buffer distance
    3. Query all noise sources within max buffer distance
    4. Apply specific buffer per category and filter intersecting features
    """
    try:
        strapi_url = os.getenv("STRAPI_URL", "http://localhost:1337")
        categories_url = f"{strapi_url}/api/noise-source-categories"
        
        try:
            response = httpx.get(categories_url, timeout=10.0)
            response.raise_for_status()
            categories_data = response.json()
            categories = categories_data.get("data", [])
        except Exception as e:
            logger.error(f"Error fetching noise source categories from Strapi: {str(e)}")
            return {"intersections": []}
        
        if not categories:
            logger.warning("No noise source categories found in Strapi")
            return {"intersections": []}
        
        # Build category lookup: slug -> {buffer, name}
        category_info = {cat["slug"]: {"buffer": cat["buffer"], "name": cat["name"]} for cat in categories}
        max_buffer = max(info["buffer"] for info in category_info.values())
        
        logger.debug(f"Loaded {len(categories)} categories, max buffer: {max_buffer}m")
        
        safe_geom = func.ST_Buffer(func.ST_GeomFromText(wkt_geometry, 4326), 0)
        geom_2154 = func.ST_Transform(safe_geom, 2154)
        
        search_buffer = func.ST_Buffer(geom_2154, max_buffer)
        search_buffer_4326 = func.ST_Transform(search_buffer, 4326)
        
        dept_filter = [func.ST_Intersects(NoiseSourceItem.geometry, search_buffer_4326)]
        if codedept is not None:
            dept_filter.append(NoiseSourceItem.codedept == codedept)

        stmt = db.query(
            NoiseSourceItem.pk,
            NoiseSourceItem.label,
            NoiseSourceItem.category_slug,
            cast(func.ST_AsGeoJSON(NoiseSourceItem.geometry), Text).label("geometry"),
            cast(func.ST_AsGeoJSON(func.ST_Centroid(NoiseSourceItem.geometry)), Text).label("geometry_point")
        ).filter(*dept_filter)
        
        result = []
        for r in stmt.all():
            category_slug = r.category_slug
            
            if category_slug not in category_info:
                logger.warning(f"Category slug '{category_slug}' not found in Strapi categories")
                continue
            
            category_data = category_info[category_slug]
            buffer_distance = category_data["buffer"]
            category_name = category_data["name"]
            
            point_2154 = func.ST_Transform(NoiseSourceItem.geometry, 2154)
            buffered_point = func.ST_Buffer(point_2154, buffer_distance)
            buffered_point_4326 = func.ST_Transform(buffered_point, 4326)
            
            intersects = db.query(
                func.ST_Intersects(buffered_point_4326, safe_geom)
            ).filter(
                NoiseSourceItem.pk == r.pk
            ).scalar()
            
            if intersects:
                try:
                    geometry_parsed = json.loads(r.geometry)
                    geometry = geometry_parsed["coordinates"]
                except Exception as parse_err:
                    logger.warning(f"Could not parse geometry: {parse_err}")
                    geometry = None

                try:
                    geometry_point_parsed = json.loads(r.geometry_point)
                    geometry_point = geometry_point_parsed["coordinates"]
                except Exception as parse_err:
                    logger.warning(f"Could not parse geometry_point: {parse_err}")
                    geometry_point = None
                
                distance = db.query(
                    func.round(
                        func.ST_Distance(
                            func.ST_Transform(safe_geom, 2154),
                            func.ST_Transform(NoiseSourceItem.geometry, 2154)
                        )
                    )
                ).filter(
                    NoiseSourceItem.pk == r.pk
                ).scalar()
                
                result.append({
                    "label": r.label,
                    "category_slug": category_slug,
                    "category_name": category_name,
                    "distance": int(distance) if distance else 0,
                    "geometry": geometry,
                    "geometry_point": geometry_point
                })
        
        logger.debug(f"Found {len(result)} noise sources intersecting with geometry")
        
        return {
            "intersections": sorted(result, key=lambda x: x["distance"])
        }
    
    except Exception as e:
        logger.error(f"Database error in noise source query: {str(e)}")
        raise


def query_noisezone_intersecting_features(db: Session, wkt_geometry: str) -> Dict[str, Any]:
    """
    Query the database for noise zone features that intersect with the given WKT geometry.
    Returns intersecting NoiseZoneItem records with their label, alert, and intersection geometry.
    """
    try:
        safe_geom = func.ST_Buffer(func.ST_GeomFromText(wkt_geometry, 4326), 0)

        intersection_geom = func.ST_Intersection(NoiseZoneItem.geometry, safe_geom)

        stmt = db.query(
            NoiseZoneItem.id,
            NoiseZoneItem.label,
            NoiseZoneItem.alert,
            cast(func.ST_AsGeoJSON(intersection_geom), Text).label("geometry_intersection")
        ).filter(
            func.ST_Intersects(NoiseZoneItem.geometry, safe_geom)
        )

        result = []
        for r in stmt.all():
            try:
                geometry_parsed = json.loads(r.geometry_intersection)
                geometry_intersection = geometry_parsed["coordinates"]
            except Exception as parse_err:
                logger.warning(f"Could not parse noisezone geometry_intersection: {parse_err}")
                geometry_intersection = None

            result.append({
                "label": r.label.value if hasattr(r.label, 'value') else r.label,
                "alert": r.alert,
                "geometry": geometry_intersection
            })

        return {
            "intersections": result
        }

    except Exception as e:
        logger.error(f"Database error in noisezone query: {str(e)}")
        raise
