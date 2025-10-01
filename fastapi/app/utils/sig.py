from typing import Tuple
from sqlalchemy import select, literal, and_, func, case, union_all
from sqlalchemy.sql.elements import ColumnElement
from sqlalchemy.sql.selectable import CTE
import math


def base_geoms(wkt_geometry: str, source_point_geom: ColumnElement, geometry_source: ColumnElement):
    land_2154 = func.ST_Transform(func.ST_GeomFromText(wkt_geometry, 4326), 2154)
    src_2154 = func.ST_Transform(source_point_geom, 2154)
    road_2154 = func.ST_Transform(geometry_source, 2154)
    closest = func.ST_ShortestLine(land_2154, src_2154)
    pa = func.ST_StartPoint(closest)
    pb = func.ST_EndPoint(closest)
    az0 = func.ST_Azimuth(pa, pb)
    return land_2154, src_2154, road_2154, pa, pb, az0


def triangle_step_expr(
    *, pa: ColumnElement, end_point_expr: ColumnElement,
    road_2154: ColumnElement, dir_angle_expr: ColumnElement,
    far_length: float = 1_000_000.0
) -> Tuple[ColumnElement, ColumnElement]:
    far_x = func.ST_X(pa) + far_length * func.sin(dir_angle_expr)
    far_y = func.ST_Y(pa) + far_length * func.cos(dir_angle_expr)
    far_pt = func.ST_SetSRID(func.ST_MakePoint(far_x, far_y), 2154)

    ray = func.ST_MakeLine(pa, far_pt)
    raw_inter = func.ST_Intersection(ray, road_2154)
    gtype = func.GeometryType(raw_inter)

    q = case(
        (gtype == 'POINT', raw_inter),
        ((gtype.in_(['LINESTRING', 'MULTILINESTRING', 'GEOMETRYCOLLECTION'])),
         func.ST_ClosestPoint(raw_inter, pa)),
        else_=None
    )

    ring = func.ST_AddPoint(func.ST_AddPoint(func.ST_MakeLine(pa, end_point_expr), q), pa)
    tri = func.ST_MakePolygon(ring)
    return tri.label("tri"), q.label("q")


def build_arm_cte(
    *, name: str, steps: int, pa: ColumnElement, pb: ColumnElement,
    az0: ColumnElement, road_2154: ColumnElement, subangle_deg: float,
    direction: str, far_length: float = 1_000_000.0
) -> CTE:
    assert direction in ('left', 'right')
    delta = func.radians(subangle_deg) if direction == 'right' else -func.radians(subangle_deg)

    tri0, q0 = triangle_step_expr(pa=pa, end_point_expr=pb, road_2154=road_2154,
                                  dir_angle_expr=az0 + delta, far_length=far_length)
    arm = select(literal(1).label("step"), tri0, q0).cte(name=name, recursive=True)

    triN, qN = triangle_step_expr(pa=pa, end_point_expr=arm.c.q, road_2154=road_2154,
                                  dir_angle_expr=az0 + delta, far_length=far_length)

    arm = arm.union_all(
        select((arm.c.step + 1), triN, qN)
        .where(arm.c.q.isnot(None))
        .where(arm.c.step < steps)
    )
    return arm


def union_arms_to_triangles_cte(left_cte: CTE, right_cte: CTE) -> CTE:
    triangles = union_all(
        select(literal('L').label("arm"), left_cte.c.step.label("step"),
               func.ST_Transform(left_cte.c.tri, 4326).label("geom")),
        select(literal('R').label("arm"), right_cte.c.step,
               func.ST_Transform(right_cte.c.tri, 4326).label("geom"))
    ).cte("triangles")
    return triangles


def intersecting_triangle_groups_cte(triangles_cte: CTE, topo_table, valid_col="is_valid_now") -> CTE:
    tri_hits = (
        select(triangles_cte.c.arm, triangles_cte.c.step)
        .select_from(
            triangles_cte.join(
                topo_table,
                and_(
                    getattr(topo_table, valid_col) == True,
                    func.ST_Intersects(topo_table.geometry, triangles_cte.c.geom)
                )
            )
        )
        .group_by(triangles_cte.c.arm, triangles_cte.c.step)
    ).cte("tri_hits")
    return tri_hits


def angle_view_from_counts(full_angle: float, sub_angle: float, intersecting_count: int) -> float:
    """Angle de vue = angle total - angle masqué."""
    angle_masque = max(intersecting_count, 0) * float(sub_angle)
    return max(float(full_angle) - angle_masque, 0.0)


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