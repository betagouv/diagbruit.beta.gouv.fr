from typing import List
from dotenv import load_dotenv

from app.utils.strapi import cached_strapi_get

load_dotenv()

MAX_RETRIES = 5
RETRY_DELAY_SECONDS = 0.5


def fetch_recommendations_from_api() -> List[dict]:
    """
    Fetch recommendations from the API with retry logic.
    Returns an empty list if the API call fails after retries.
    """
    data = cached_strapi_get(
        "/api/recommendations",
        params={"populate": "*"},
        retries=MAX_RETRIES,
        retry_delay=RETRY_DELAY_SECONDS,
    )
    return data.get("data", []) if data else []


def get_recommendations_by_score(score: float) -> List[dict]:
    """
    Return a list of recommendations that match the given score.
    """
    recommendations = fetch_recommendations_from_api()

    def is_valid(rec):
        cond = rec.get("conditions", {})
        score_gte = cond.get("score_gte")
        score_lte = cond.get("score_lte")

        if score_gte is not None and score < score_gte:
            return False
        if score_lte is not None and score > score_lte:
            return False
        return True

    return [
        {
            "title": r["title"],
            "categories": r["categories"],
            "content": r["content"],
            "links": r.get("links", []),
        }
        for r in recommendations if is_valid(r)
    ]
