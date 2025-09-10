from . import (compute_intersection_score, load_land_levels, group_intersections_by_identifier)
from app.utils import get_risk_from_score
from collections import defaultdict
from shapely.geometry import shape, mapping, MultiPolygon, Polygon
from shapely.ops import unary_union, transform
import pyproj

def _geometry_from_intersection(intersection):
    """
    Build a Shapely geometry from the intersection's 'geometry_intersection' field.
    The input looks like a GeoJSON MultiPolygon/Polygon coordinates array (in EPSG:4326).
    """
    coords = intersection.get("geometry_intersection")
    if not coords:
        return None

    for gtype in ("MultiPolygon", "Polygon"):
        try:
            geom = shape({"type": gtype, "coordinates": coords})
            if not geom.is_valid:
                geom = geom.buffer(0)
            return geom
        except Exception:
            continue
    return None

def _utm_transformer_for_geom(geom):
    """
    Choisit automatiquement une projection UTM (EPSG:326xx/327xx) selon la position.
    Retourne une fonction de transformation WGS84 -> mètres.
    """
    # Point représentatif sûr (intérieur à la géométrie)
    rep = geom.representative_point()
    lon, lat = rep.x, rep.y
    zone = int((lon + 180) // 6) + 1
    epsg = (32600 if lat >= 0 else 32700) + zone  # 326 = hém. Nord, 327 = Sud
    return pyproj.Transformer.from_crs("EPSG:4326", f"EPSG:{epsg}", always_xy=True).transform

def _area_m2(geom):
    """
    Calcule l'aire en m² en reprojetant la géométrie en UTM local.
    """
    project = _utm_transformer_for_geom(geom)
    geom_m = transform(project, geom)
    return geom_m.area

def get_zones_from_intersections(intersections, min_area=1.0):
    """
    Produit des 'zones' par niveau de risque.
    - Sortie: geometry = coordonnées uniquement (sans 'type'), en EPSG:4326
    - Filtre les géométries dont l'aire < min_area (m²)
    """
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

        clipped = geom if cumulative_higher is None else geom.difference(cumulative_higher)

        if clipped.is_empty:
            continue
        if not clipped.is_valid:
            clipped = clipped.buffer(0)
        if clipped.is_empty:
            continue

        valid_coords = []

        if clipped.geom_type == "Polygon":
            if _area_m2(clipped) >= min_area:
                valid_coords = [list(clipped.exterior.coords)]
        elif clipped.geom_type == "MultiPolygon":
            for p in clipped.geoms:
                if p.is_empty:
                    continue
                if not p.is_valid:
                    p = p.buffer(0)
                    if p.is_empty:
                        continue
                if _area_m2(p) >= min_area:
                    valid_coords.append(list(p.exterior.coords))
        else:
            pass

        if not valid_coords:
            cumulative_higher = clipped if cumulative_higher is None else unary_union([cumulative_higher, clipped])
            continue

        zones.append({
            "risk": risk,
            "geometry": valid_coords
        })

        cumulative_higher = clipped if cumulative_higher is None else unary_union([cumulative_higher, clipped])

    return zones
