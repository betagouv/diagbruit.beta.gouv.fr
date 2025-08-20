import json
import pytest
from pathlib import Path
from app.algorithm import get_parcelle_diagnostic


def collect_test_cases():
    """Collect all input.json files under tests/unit/score_land_transport/data/"""
    base_path = Path(__file__).parent / "data"
    return sorted(base_path.rglob("input.json"))


def load_case(path: Path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


@pytest.mark.parametrize("input_path", collect_test_cases(), ids=lambda p: str(p.parent))
def test_get_land_score_from_sources_cases(input_path):
    case = load_case(input_path)

    diagnostic = get_parcelle_diagnostic(
        noisemap_intersections=case["noisemap_intersections"],
        soundclassification_intersections=case["soundclassification_intersections"],
        peb_intersections=case["peb_intersections"]
    )

    assert diagnostic['score'] == case["expected_score"], (
        f"{input_path} failed: got {diagnostic['score']}, expected {case['expected_score']}"
    )
