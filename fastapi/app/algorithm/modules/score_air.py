import yaml
from pathlib import Path


def load_config():
    with open(Path(__file__).resolve().parent.parent.parent / "references" / "globals.yaml", "r") as f:
        return yaml.safe_load(f)


CONFIG = load_config()

def load_levels():
    """
    Load YAML files with levels depending on indicetype needed.
    """
    base_path = Path(__file__).resolve().parent.parent.parent / "references"
    filename = f"air_levels.yaml"
    filepath = base_path / filename

    with open(filepath, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_air_score_from_sources(intersections_peb):
    """
    Returns the score based on the zone of the air intersection from peb.
    """
    score = 0
    sorted_intersections = sorted(intersections_peb, key=lambda x: x["percent_impacted"], reverse=True)

    if len(intersections_peb) == 0:
        return score

    levels = load_levels()

    zone_score_map = {level["zone"]: level["score"] for level in levels}
    threshold = CONFIG.get("intersection_air_dominating_percentage_difference", 0.7)

    if len(sorted_intersections) >= 2:
        top = sorted_intersections[0]
        second = sorted_intersections[1]
        diff = top["percent_impacted"] - second["percent_impacted"]

        if diff >= threshold:
            return zone_score_map[top["zone"]]

    zones = {item.get("zone") for item in intersections_peb if item.get("zone")}
    scores = [zone_score_map[zone] for zone in zones if zone in zone_score_map]

    return max(scores)