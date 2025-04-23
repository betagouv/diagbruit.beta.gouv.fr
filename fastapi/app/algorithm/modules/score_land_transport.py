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


def compute_intersection_score(intersection, levels, intersections_infra):
    """
    Computes the score of a single intersection based on its 'legende' value
    and specific conditions related to infrastructure type.
    """
    legende = intersection.get("legende", 0)
    score = 0

    for level in levels:
        if legende >= level["value_gte"]:
            score = level["score"]

    # Specific case: if score is 7 and there's a matching type C intersection for the same typesource, add +1
    if score == 7 and any(
        inf.get("cbstype") == "C" and inf.get("typesource") == intersection.get("typesource")
        for inf in intersections_infra
    ):
        score += 1

    return score


def get_land_score_from_sources(intersections_agglo, intersections_infra, indicetype):
    """
    Returns the final score based on all intersections.

    Process:
    1. Compute the score for each intersection.
    2. Identify the highest score.
    3. If multiple intersections share the highest score, apply a +1 penalty.
    4. Return the final score.
    """
    all_intersections = intersections_agglo + intersections_infra

    if not all_intersections:
        return 0

    levels = load_levels(indicetype)

    intersection_scores = [
        compute_intersection_score(intersection, levels, intersections_infra)
        for intersection in all_intersections
    ]

    max_score = max(intersection_scores)

    count_max_scores = intersection_scores.count(max_score)

    if count_max_scores > 1:
        max_score += 1

    return max_score
