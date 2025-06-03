import yaml
from pathlib import Path
from collections import defaultdict


def load_config():
    with open(Path(__file__).resolve().parent.parent.parent / "references" / "globals.yaml", "r") as f:
        return yaml.safe_load(f)


CONFIG = load_config()


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
    percent_impacted = intersection.get("percent_impacted", 0)
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

    return {'legende': legende, 'score': score, 'percent_impacted': percent_impacted}


def refine_max_score_from_percentage_impacted(scores_by_percentage_sorted, current_max_score):
    """
    Refine the max score if the top percent_impacted is much higher than the second.
    Only one object per unique legende is considered (the one with max percent_impacted).
    """
    unique_by_legende = {}
    for item in scores_by_percentage_sorted:
        legende = item['legende']
        if legende not in unique_by_legende:
            unique_by_legende[legende] = item

    reduced_list = list(unique_by_legende.values())

    threshold = CONFIG.get("intersection_dominating_percentage_difference", 0.5)
    if len(reduced_list) >= 2:
        p1 = reduced_list[0].get('percent_impacted', 0)
        p2 = reduced_list[1].get('percent_impacted', 0)
        if p1 - p2 >= threshold:
            return reduced_list[0].get('score', current_max_score)

    return current_max_score


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

    intersection_scores_by_percentage_impacted = sorted(
        [
            compute_intersection_score(intersection, levels, intersections_infra)
            for intersection in all_intersections
        ],
        key=lambda item: item['percent_impacted'],
        reverse=True
    )

    intersection_scores = [item['score'] for item in intersection_scores_by_percentage_impacted]
    max_score = max(intersection_scores)
    max_score = refine_max_score_from_percentage_impacted(intersection_scores_by_percentage_impacted, max_score)

    count_max_scores = intersection_scores.count(max_score)

    if count_max_scores > 1:
        max_score += 1

    return max_score
