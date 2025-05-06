import yaml
from pathlib import Path
from typing import List


def load_recommendations() -> List[dict]:
    """
    Load the YAML file containing the recommendations.
    """
    base_path = Path(__file__).resolve().parent.parent.parent / "references"
    filepath = base_path / "recommendations.yaml"

    with open(filepath, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_recommendations_by_score(score: float) -> List[dict]:
    """
    Return a list of recommendations that match the given score.
    """
    recommendations = load_recommendations()

    def is_valid(rec):
        s = rec.get("score", {})
        if "value_gte" in s and score < s["value_gte"]:
            return False
        if "value_lte" in s and score > s["value_lte"]:
            return False
        return True

    return [
            {
                "title": r["title"],
                "category": r["category"],
                "content": r["content"],
                "links": r["links"]
            }
            for r in recommendations if is_valid(r)
        ]