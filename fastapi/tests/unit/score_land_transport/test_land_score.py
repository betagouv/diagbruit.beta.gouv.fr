import json
import pytest
from pathlib import Path
from app.algorithm.modules.score_land_transport import get_land_score_from_sources


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

    result = get_land_score_from_sources(
        intersections_agglo=case["intersections_agglo"],
        intersections_infra=case["intersections_infra"],
        indicetype=case["indicetype"],
        percent_unimpacted=0
    )

    assert result == case["expected_score"], (
        f"{input_path} failed: got {result}, expected {case['expected_score']}"
    )
