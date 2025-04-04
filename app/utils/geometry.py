def create_multipolygon_from_coordinates(coordinates):
    """
    Extract coordinates from the first feature in a GeoJSON object.
    Returns a WKT representation of the geometry.
    """
    wkt_parts = []
    for polygon in coordinates:
        poly_parts = []
        for ring in polygon:
            ring_str = ', '.join([f"{point[0]} {point[1]}" for point in ring])
            poly_parts.append(f"({ring_str})")
        wkt_parts.append(f"({', '.join(poly_parts)})")
    wkt = f"MULTIPOLYGON({', '.join(wkt_parts)})"
    return wkt


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
