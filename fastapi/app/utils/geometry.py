def create_multipolygon_from_coordinates(coordinates) -> str:
    """
    Convert coordinates to WKT MULTIPOLYGON.
    Handles both Polygon and MultiPolygon GeoJSON coordinate formats.
    """
    def format_ring(ring):
        return ', '.join([f"{point[0]} {point[1]}" for point in ring])

    if (
        isinstance(coordinates, list)
        and coordinates
        and isinstance(coordinates[0], list)
        and coordinates[0]
        and isinstance(coordinates[0][0], list)
        and isinstance(coordinates[0][0][0], float)
    ):
        # It's a Polygon -> wrap in a list to treat as single MultiPolygon
        coordinates = [coordinates]

    wkt_parts = []
    for polygon in coordinates:
        poly_parts = [f"({format_ring(ring)})" for ring in polygon]
        wkt_parts.append(f"({', '.join(poly_parts)})")

    return f"MULTIPOLYGON({', '.join(wkt_parts)})"


def create_polygon_from_bbox(bbox):
    """
    Crée une géométrie POLYGON WKT à partir d'une bounding box.

    Args:
        bbox: [xmin, ymin, xmax, ymax]

    Returns:
        WKT string représentant le polygone.
    """
    if len(bbox) != 4:
        raise ValueError("La bounding box doit contenir exactement 4 valeurs : [xmin, ymin, xmax, ymax]")

    xmin, ymin, xmax, ymax = bbox

    ring = [
        (xmin, ymin),
        (xmin, ymax),
        (xmax, ymax),
        (xmax, ymin),
        (xmin, ymin)
    ]

    ring_str = ', '.join([f"{x} {y}" for x, y in ring])
    wkt = f"POLYGON(({ring_str}))"
    return wkt


def get_area_m2_from_wkt(polygon_wkt: str) -> float:
    """
    Calculate the area in square meters from a WKT geometry string.
    Uses UTM projection based on the geometry's centroid location.
    
    Args:
        polygon_wkt: WKT string (POLYGON or MULTIPOLYGON) in EPSG:4326
        
    Returns:
        Area in square meters
    """
    from shapely import wkt
    from shapely.ops import transform
    import pyproj
    
    geom = wkt.loads(polygon_wkt)
    rep = geom.representative_point()
    lon, lat = rep.x, rep.y
    zone = int((lon + 180) // 6) + 1
    epsg = (32600 if lat >= 0 else 32700) + zone
    project = pyproj.Transformer.from_crs("EPSG:4326", f"EPSG:{epsg}", always_xy=True).transform
    geom_m = transform(project, geom)
    return geom_m.area
