import yaml
from pathlib import Path
from collections import defaultdict


def load_config():
    with open(Path(__file__).resolve().parent.parent.parent / "references" / "globals.yaml", "r") as f:
        return yaml.safe_load(f)


CONFIG = load_config()


def load_land_levels(indicetype):
    """
    Load YAML files with levels depending on indicetype needed.
    """
    base_path = Path(__file__).resolve().parent.parent.parent / "references"
    filename = f"land_{indicetype.lower()}_levels.yaml"
    filepath = base_path / filename

    with open(filepath, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def compute_intersection_score(intersection, levels, all_intersections):
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
        for inf in all_intersections
    ):
        score += 1

    return score


def compute_aggregated_score_for_intersections(intersections, levels, all_intersections):
    grouped_by_legende = defaultdict(list)
    for item in intersections:
        grouped_by_legende[item['legende']].append(item)

    reduced_list = sorted([items[0] for items in grouped_by_legende.values()], key=lambda item: item.get('percent_impacted', 0), reverse=True)

    threshold = CONFIG.get("intersection_land_dominating_percentage_difference", 0.5)
    if len(reduced_list) >= 2:
        p1 = reduced_list[0].get('percent_impacted', 0)
        p2 = reduced_list[1].get('percent_impacted', 0)
        if p1 - p2 >= threshold:
            return compute_intersection_score(reduced_list[0], levels, all_intersections)

    return max([
        compute_intersection_score(intersection, levels, all_intersections) for intersection in intersections
    ])


def group_intersections_by_identifier(intersections):
    """
    Groups intersections by a unique identifier based on the (typesource, codeinfra) pair.
    """
    grouped = defaultdict(list)
    for item in intersections:
        identifier = f"{item['typesource']}_{item['codeinfra']}"
        grouped[identifier].append(item)
    return grouped


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

    levels = load_land_levels(indicetype)
    grouped = group_intersections_by_identifier(all_intersections)

    scores = [
        compute_aggregated_score_for_intersections(group, levels, all_intersections)
        for group in grouped.values()
    ]

    max_score = max(scores)
    return max_score + 1 if scores.count(max_score) > 1 else max_score
