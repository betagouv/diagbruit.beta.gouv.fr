import pytest

from app.utils.acoustic import (
    _combine_isolations,
    _cumulative_correction,
    compute_parcelle_isolations,
    get_air_isolation,
)


# --- _cumulative_correction ------------------------------------------------

@pytest.mark.parametrize("gap,expected", [
    (0, 3),
    (1, 3),
    (2, 2),
    (3, 2),
    (4, 1),
    (9, 1),
    (10, 0),
    (100, 0),
])
def test_cumulative_correction(gap, expected):
    assert _cumulative_correction(gap) == expected


# --- _combine_isolations ---------------------------------------------------

def test_combine_empty():
    assert _combine_isolations([]) == 0


def test_combine_only_zeros():
    assert _combine_isolations([0, 0]) == 0


def test_combine_single_source():
    assert _combine_isolations([33]) == 33


def test_combine_two_sources_user_example():
    # 31 vs 33 -> 33 + 2 = 35
    assert _combine_isolations([31, 33]) == 35


def test_combine_four_sources_user_example():
    # 31, 33, 36, 38 -> 35 -> 39 -> 42
    assert _combine_isolations([31, 33, 36, 38]) == 42


def test_combine_unsorted_input_is_sorted_ascending():
    assert _combine_isolations([38, 31, 36, 33]) == 42


def test_combine_drops_zero_sources():
    # 0 represents a category-out-of-table source -> excluded
    assert _combine_isolations([0, 31, 33]) == 35


def test_combine_large_gap_no_correction():
    # gap=20 -> +0
    assert _combine_isolations([30, 50]) == 50


# --- get_air_isolation -----------------------------------------------------

def test_air_isolation_empty():
    assert get_air_isolation([]) == 0


@pytest.mark.parametrize("zone,expected", [
    ("A", 45),
    ("B", 40),
    ("C", 35),
    ("D", 32),
])
def test_air_isolation_single_zone(zone, expected):
    assert get_air_isolation([{"acoustic_zone": zone}]) == expected


def test_air_isolation_priority():
    # Several zones present -> highest priority (A > B > C > D) wins
    assert get_air_isolation(
        [{"acoustic_zone": "C"}, {"acoustic_zone": "A"}, {"acoustic_zone": "B"}]
    ) == 45


# --- compute_parcelle_isolations ------------------------------------------

def test_compute_no_sources_returns_30_floor():
    assert compute_parcelle_isolations([], []) == (30, 30)


def test_compute_floor_applied_at_30():
    # Distant cat 3 source with negative corrections gives values below 30,
    # the final isolation must be clamped to 30.
    sources = [{
        "acoustic_category": 3,
        "min_distance": 200,
        "max_distance": 250,
        "closest_correction": -6,
        "farthest_correction": -6,
    }]
    iso_min, iso_max = compute_parcelle_isolations(sources, [])
    assert iso_min == 30
    assert iso_max == 30


def test_compute_mouvaux_parcelle_228():
    """
    Real-world case reported by domain expert.
    3 land sources, no PEB.
    isolation_max (most exposed point) cumulates the 3 land sources:
      cat 4 @ 5m   -> 35
      cat 3 @ 25m  -> 36
      cat 3 @ 30m  -> 35
      sorted ascending: [35, 35, 36]
        35 vs 35 -> gap=0 -> +3 -> 38
        38 vs 36 -> gap=2 -> +2 -> 40
    isolation_min (least exposed point):
      cat 4 @ 62m (corr -6) -> 0 (out of table at bucket 50) -> excluded
      cat 3 @ 71m (corr -3) -> 32-3 = 29
      cat 3 @ 75m (corr -6) -> 32-6 = 26
      sorted ascending: [26, 29]
        26 vs 29 -> gap=3 -> +2 -> 31
    """
    sources = [
        {
            "label": "RUE DE ROUBAIX (RD9)",
            "acoustic_category": 4,
            "min_distance": 5,
            "max_distance": 62,
            "closest_correction": 0,
            "farthest_correction": -6,
        },
        {
            "label": "RUE FRANKLIN ROOSEVELT (RD9)",
            "acoustic_category": 3,
            "min_distance": 25,
            "max_distance": 71,
            "closest_correction": 0,
            "farthest_correction": -3,
        },
        {
            "label": "D670",
            "acoustic_category": 3,
            "min_distance": 30,
            "max_distance": 75,
            "closest_correction": 0,
            "farthest_correction": -6,
        },
    ]
    iso_min, iso_max = compute_parcelle_isolations(sources, [])
    assert iso_max == 40
    assert iso_min == 31


def test_compute_land_and_air_combined():
    # 1 close cat 3 land source -> 36; air zone C -> 35
    # Combined ascending: [35, 36] -> 36 + 3 = 39
    sources = [{
        "acoustic_category": 3,
        "min_distance": 25,
        "max_distance": 25,
        "closest_correction": 0,
        "farthest_correction": 0,
    }]
    air = [{"acoustic_zone": "C"}]
    iso_min, iso_max = compute_parcelle_isolations(sources, air)
    assert iso_max == 39
    assert iso_min == 39


def test_compute_single_land_source_no_cumul():
    sources = [{
        "acoustic_category": 3,
        "min_distance": 25,
        "max_distance": 25,
        "closest_correction": 0,
        "farthest_correction": 0,
    }]
    iso_min, iso_max = compute_parcelle_isolations(sources, [])
    assert iso_max == 36
    assert iso_min == 36


# --- regression: real Nantes parcelle 44109 EM 0003 -----------------------

def test_compute_nantes_parcelle_44109_em_0003():
    """
    Parcelle exposed to rail T1 (cat 4) + road R DE STRASBOURG (cat 3) + PEB zone D.
    isolation_max cumulates the most-exposed point of each source:
      cat 4 @ 18m (corr 0)  -> 33
      cat 3 @ 35m (corr -6) -> 29
      PEB zone D            -> 32
      sorted ascending: [29, 32, 33]
        29 vs 32 -> gap=3 -> +2 -> 34
        34 vs 33 -> gap=1 -> +3 -> 37
    isolation_min (least-exposed point, max_distance side):
      cat 4 @ 244m -> 0 (excluded), cat 3 @ 259m -> 0 (excluded)
      only PEB zone D -> 32
    """
    sources = [
        {
            "label": "T1",
            "acoustic_category": 4,
            "min_distance": 18,
            "max_distance": 244,
            "closest_correction": 0,
            "farthest_correction": -9,
        },
        {
            "label": "R DE STRASBOURG",
            "acoustic_category": 3,
            "min_distance": 35,
            "max_distance": 259,
            "closest_correction": -6,
            "farthest_correction": -9,
        },
    ]
    air = [{"acoustic_zone": "D"}]
    iso_min, iso_max = compute_parcelle_isolations(sources, air)
    assert iso_max == 37
    assert iso_min == 32
