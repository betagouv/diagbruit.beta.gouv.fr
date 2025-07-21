import json
import os
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

def load_json(file_path):
    with open(file_path, encoding="utf-8") as f:
        return json.load(f)

test_cases = [
    ("input_geom_simple.json", "expected_output_geom_simple.json")
]

@pytest.mark.asyncio
@pytest.mark.parametrize("input_file,expected_file", test_cases)
async def test_diag_generate_from_geometries(input_file, expected_file):
    payload = load_json(os.path.join("tests", "integration", "data", input_file))
    expected = load_json(os.path.join("tests", "integration", "data", expected_file))

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/diag/generate/from-geometries", json=payload)

    assert response.status_code == 200
    assert response.json() == expected
