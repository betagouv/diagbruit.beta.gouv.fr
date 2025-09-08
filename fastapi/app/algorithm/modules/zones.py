from . import (compute_intersection_score, load_land_levels, group_intersections_by_identifier)
from app.utils import get_risk_from_score
from collections import defaultdict
from shapely.geometry import shape, mapping, MultiPolygon, Polygon
from shapely.ops import unary_union

def _geometry_from_intersection(intersection):
    """
    Build a Shapely geometry from the intersection's 'geometry_intersection' field.
    The input looks like a GeoJSON MultiPolygon coordinates array.
    """
    coords = intersection.get("geometry_intersection")
    if not coords:
        return None

    try:
        geom = shape({"type": "Polygon", "coordinates": coords})
        if not geom.is_valid:
            geom = geom.buffer(0)
        return geom
    except Exception:
        return None

def get_zones_from_intersections(intersections):
    levels = load_land_levels('LD')
    grouped = group_intersections_by_identifier(intersections)

    risk_buckets = defaultdict(list)
    for group in grouped.values():
        for intersection in group:
            score = compute_intersection_score(intersection, levels, group)
            risk = get_risk_from_score(score)
            geom = _geometry_from_intersection(intersection)
            if geom and not geom.is_empty:
                risk_buckets[risk].append(geom)

    merged_by_risk = {}
    for risk, geoms in risk_buckets.items():
        if not geoms:
            continue
        merged = unary_union(geoms)
        # Clean
        if not merged.is_valid:
            merged = merged.buffer(0)
        if not merged.is_empty:
            merged_by_risk[risk] = merged

    if not merged_by_risk:
        return []

    risks_desc = sorted(merged_by_risk.keys(), reverse=True)

    zones = []
    cumulative_higher = None

    for risk in risks_desc:
        geom = merged_by_risk[risk]
        if geom.is_empty:
            continue

        if cumulative_higher is None:
            clipped = geom
        else:
            clipped = geom.difference(cumulative_higher)

        if clipped.is_empty:
            continue
        if not clipped.is_valid:
            clipped = clipped.buffer(0)
        if clipped.is_empty:
            continue

        zones.append({
            "risk": risk,
            "geometry": mapping(clipped)
        })

        cumulative_higher = clipped if cumulative_higher is None else unary_union([cumulative_higher, clipped])

    return zones
