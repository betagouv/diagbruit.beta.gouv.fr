def create_multipolygon_from_coordinates(coordinates) -> str:
    """
    Convert either a Polygon or MultiPolygon GeoJSON coordinates to WKT MULTIPOLYGON.
    """
    def format_ring(ring):
        return ', '.join([f"{point[0]} {point[1]}" for point in ring])

    if all(isinstance(ring[0], float) for ring in coordinates[0]):
        poly_parts = [f"({format_ring(ring)})" for ring in coordinates]
        return f"MULTIPOLYGON(({', '.join(poly_parts)}))"
    else:
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
