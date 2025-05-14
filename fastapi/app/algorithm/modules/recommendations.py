import os
import requests
from typing import List
from dotenv import load_dotenv

load_dotenv()

API_BASE_URL = os.getenv("STRAPI_URL", "http://localhost:1337")
API_RECOMMENDATIONS_ENDPOINT = f"{API_BASE_URL}/api/recommendations?populate=*"


def fetch_recommendations_from_api() -> List[dict]:
    """
    Fetch recommendations from the API.
    """
    response = requests.get(API_RECOMMENDATIONS_ENDPOINT)
    response.raise_for_status()
    data = response.json()
    return data.get("data", [])


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
            "category": r.get("category").get('title'),
            "content": r["content"],
            "links": r.get("links", []),
        }
        for r in recommendations if is_valid(r)
    ]
