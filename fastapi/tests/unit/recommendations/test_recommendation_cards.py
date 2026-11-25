import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.algorithm.modules import recommendations as module
from app.routes import recommendations as route


@pytest.fixture
def strapi_calls(monkeypatch):
    calls = []

    def fake_get(path, params=None, **kwargs):
        calls.append((path, params))
        return {
            "data": [
                {
                    "title": "Réaliser une étude acoustique",
                    "slug": "realiser-une-etude-acoustique",
                    "imageThumbnail": {"url": "/uploads/etude.jpg", "alternativeText": "Acousticien"},
                },
                {"title": "Sans image", "slug": "sans-image", "imageThumbnail": None},
            ]
        }

    monkeypatch.setattr(module, "cached_strapi_get", fake_get)
    return calls


@pytest.fixture
def client():
    # Mount only this router: app.main needs a database.
    app = FastAPI()
    app.include_router(route.router)
    return TestClient(app)


def test_cards_are_shaped_and_query_filters_by_slug(strapi_calls):
    cards = module.get_recommendation_cards(["realiser-une-etude-acoustique", "sans-image"])

    assert cards == [
        {
            "title": "Réaliser une étude acoustique",
            "slug": "realiser-une-etude-acoustique",
            "imageUrl": "/uploads/etude.jpg",
            "imageAlt": "Acousticien",
        },
        {"title": "Sans image", "slug": "sans-image", "imageUrl": "", "imageAlt": ""},
    ]
    path, params = strapi_calls[0]
    assert path == "/api/recommendations"
    assert params["filters[slug][$in][0]"] == "realiser-une-etude-acoustique"
    assert params["filters[slug][$in][1]"] == "sans-image"
    assert params["populate[0]"] == "imageThumbnail"


def test_no_slug_does_not_call_strapi(strapi_calls):
    assert module.get_recommendation_cards([]) == []
    assert strapi_calls == []


def test_strapi_unreachable_returns_empty_list(monkeypatch):
    monkeypatch.setattr(module, "cached_strapi_get", lambda *a, **k: None)
    assert module.get_recommendation_cards(["a"]) == []


def test_route_returns_cards(strapi_calls, client):
    response = client.get(
        "/recommendations/cards",
        params=[("slugs", "realiser-une-etude-acoustique"), ("slugs", "sans-image")],
    )
    assert response.status_code == 200
    assert [card["slug"] for card in response.json()] == ["realiser-une-etude-acoustique", "sans-image"]


@pytest.mark.parametrize("slugs", [
    ["Pas Un Slug"],
    ["../etc/passwd"],
    [f"slug-{i}" for i in range(11)],
])
def test_route_rejects_invalid_slugs(slugs, client, strapi_calls):
    response = client.get("/recommendations/cards", params=[("slugs", s) for s in slugs])
    assert response.status_code == 422
    assert strapi_calls == []


def test_route_requires_slugs(client):
    assert client.get("/recommendations/cards").status_code == 422
