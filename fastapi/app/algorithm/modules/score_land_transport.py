import yaml
from pathlib import Path


def load_levels(indicetype):
    """
    Load YAML files with levels depending on indicetype needed.
    """
    base_path = Path(__file__).resolve().parent.parent.parent / "references"
    filename = f"land_{indicetype.lower()}_levels.yaml"
    filepath = base_path / filename

    with open(filepath, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_land_score_from_sources(intersections_agglo, intersections_infra, indicetype):
    """
    Returns the score based on the intersection with the highest 'legende' value,
    using the appropriate scale loaded from YAML depending on 'indicetype'.
    """
    all_intersections = intersections_agglo + intersections_infra

    reference_intersection = max(
        all_intersections,
        key=lambda x: x.get("legende", 0),
        default=None
    )

    if not reference_intersection:
        return 0

    max_value = reference_intersection.get("legende", 0)

    levels = load_levels(indicetype)

    score = 0
    for level in levels:
        if max_value >= level["value_gte"]:
            score = level["score"]

            if score == 7 and any(intersection.get("cbstype") == "C" for intersection in intersections_infra):
                score += 1

    codeinfras_with_max_legende = {
        item.get("codeinfra")
        for item in all_intersections
        if item.get("legende") >= max_value and item.get("codeinfra") is not None
    }
    count_max_legende = len(codeinfras_with_max_legende)

    if count_max_legende > 1:
        score += 1

    return score