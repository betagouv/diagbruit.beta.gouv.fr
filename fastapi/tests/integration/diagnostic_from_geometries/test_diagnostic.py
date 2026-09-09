import json
import os
import re
import pytest
from httpx import AsyncClient, ASGITransport
from shapely.geometry import shape
from app.main import app

# Geometry payloads hold bare GeoJSON coordinates (no "type"). ST_Subdivide on noisemap
# means a feature's intersection comes back as an equivalent MultiPolygon instead of a
# Polygon, with extra collinear vertices along the cut lines and a different ring start;
# the zone polygons built from those intersections inherit both. Same shapes, different
# coordinate lists. So geometries are compared by geometric equality — symmetric
# difference under 0.1% of the area — and feature lists order-independently. Every other
# field is still compared exactly, so any value or feature change still fails the test.
GEOM_KEY = "geometry_intersection"
ZONE_GEOM_PATH = re.compile(r"\.zones\[\d+\]\.geometry$")
GEOM_REL_TOL = 1e-3


def _is_geometry_path(path):
    return path.endswith(GEOM_KEY) or ZONE_GEOM_PATH.search(path) is not None


def load_json(file_path):
    with open(file_path, encoding="utf-8") as f:
        return json.load(f)


def _coords_to_shape(coords):
    depth, node = 0, coords
    while isinstance(node, list) and node:
        depth += 1
        node = node[0]
    if depth == 3:
        return shape({"type": "Polygon", "coordinates": coords})
    if depth == 4:
        return shape({"type": "MultiPolygon", "coordinates": coords})
    raise AssertionError(f"unexpected geometry nesting depth {depth}")


def _assert_geometry_equal(actual, expected, path):
    a = _coords_to_shape(actual).buffer(0)
    e = _coords_to_shape(expected).buffer(0)
    area = max(a.area, e.area)
    if area == 0:
        assert a.is_empty and e.is_empty, f"{path}: one geometry is empty"
        return
    sym_diff = a.symmetric_difference(e).area
    assert sym_diff <= GEOM_REL_TOL * area, (
        f"{path}: geometries differ (symmetric diff {sym_diff:.3e}, area {area:.3e})"
    )


def _feature_sort_key(feature):
    return json.dumps(
        {k: v for k, v in feature.items() if k != GEOM_KEY},
        sort_keys=True,
        default=str,
    )


def assert_diagnostic_equal(actual, expected, path="$"):
    if _is_geometry_path(path):
        _assert_geometry_equal(actual, expected, path)
        return
    if isinstance(expected, dict):
        assert isinstance(actual, dict), f"{path}: expected object, got {type(actual).__name__}"
        assert set(actual) == set(expected), f"{path}: key mismatch {set(actual) ^ set(expected)}"
        for key in expected:
            assert_diagnostic_equal(actual[key], expected[key], f"{path}.{key}")
        return
    if isinstance(expected, list):
        assert isinstance(actual, list), f"{path}: expected list, got {type(actual).__name__}"
        assert len(actual) == len(expected), f"{path}: length {len(actual)} != {len(expected)}"
        if expected and isinstance(expected[0], dict) and GEOM_KEY in expected[0]:
            actual = sorted(actual, key=_feature_sort_key)
            expected = sorted(expected, key=_feature_sort_key)
        for i, (a, e) in enumerate(zip(actual, expected)):
            assert_diagnostic_equal(a, e, f"{path}[{i}]")
        return
    assert actual == expected, f"{path}: {actual!r} != {expected!r}"


test_cases = [
    ("simple_parcelle_geometry/input.json", "simple_parcelle_geometry/output.json"),
    ("double_parcelles_geometries/input.json", "double_parcelles_geometries/output.json")
]

@pytest.mark.asyncio
@pytest.mark.parametrize("input_file,expected_file", test_cases)
async def test_diag_generate_from_geometries(input_file, expected_file):
    payload = load_json(os.path.join("tests", "integration", "diagnostic_from_geometries", "data", input_file))
    expected = load_json(os.path.join("tests", "integration", "diagnostic_from_geometries", "data", expected_file))

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/diag/generate/from-geometries", json=payload)

    assert response.status_code == 200
    assert_diagnostic_equal(response.json(), expected)
