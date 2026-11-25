import re
from typing import List

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.algorithm.modules.recommendations import get_recommendation_cards

router = APIRouter(
    prefix="/recommendations",
    tags=["recommendations"],
)

MAX_SLUGS = 10
SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


class RecommendationCard(BaseModel):
    title: str
    slug: str
    imageUrl: str
    imageAlt: str


@router.get("/cards", response_model=List[RecommendationCard])
def get_cards(
    slugs: List[str] = Query(
        ...,
        description="Slugs of the recommendations to return (repeat the parameter).",
        examples=[["realiser-une-etude-acoustique"]],
    ),
):
    """Card data (title, slug, thumbnail) of the recommendations matching `slugs`.

    Unknown slugs are absent from the response, so the client can render an empty
    card for them. Proxies the Strapi CMS so the front does not call it directly.
    """
    if len(slugs) > MAX_SLUGS:
        raise HTTPException(status_code=422, detail=f"At most {MAX_SLUGS} slugs are allowed")
    for slug in slugs:
        if len(slug) > 200 or not re.match(SLUG_PATTERN, slug):
            raise HTTPException(status_code=422, detail=f"Invalid slug: {slug!r}")

    # Deduplicate while keeping order, so the Strapi cache key stays stable.
    unique_slugs = list(dict.fromkeys(slugs))
    return get_recommendation_cards(unique_slugs)
