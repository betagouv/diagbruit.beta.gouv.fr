import pytest
from app.algorithm.modules import score_land_transport


@pytest.fixture(autouse=True)
def mock_config_and_levels(monkeypatch):
    def mock_load_config():
        return {"intersection_land_dominating_percentage_difference": 0.5}

    def mock_load_land_levels(indicetype):
        return [
            {"value_gte": 0, "score": 0},
            {"value_gte": 55, "score": 3},
            {"value_gte": 60, "score": 5},
            {"value_gte": 65, "score": 7},
            {"value_gte": 70, "score": 9},
        ] if indicetype == 'LD' else [
            {"value_gte": 0, "score": 0},
            {"value_gte": 50, "score": 3},
            {"value_gte": 55, "score": 5},
            {"value_gte": 60, "score": 7},
            {"value_gte": 65, "score": 9},
        ]

    monkeypatch.setattr(score_land_transport, "load_config", mock_load_config)
    monkeypatch.setattr(score_land_transport, "load_land_levels", mock_load_land_levels)
    monkeypatch.setattr(score_land_transport, "CONFIG", mock_load_config())
