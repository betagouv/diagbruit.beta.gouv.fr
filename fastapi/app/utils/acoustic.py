# acoustic.py

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple


def correction_from_angle(angle_vue: float) -> int:
    """
    Barème (dB) :
      >135    ->  0
      111–135 -> -1
      91–110  -> -2
      61–90   -> -3
      31–60   -> -4
      16–30   -> -5
      0–15    -> -6
      =0      -> -9
    """
    a = angle_vue
    if a == 0:
        return -9
    if a > 135.0:
        return 0
    if 110.0 < a <= 135.0:
        return -1
    if 90.0 < a <= 110.0:
        return -2
    if 60.0 < a <= 90.0:
        return -3
    if 30.0 < a <= 60.0:
        return -4
    if 15.0 < a <= 30.0:
        return -5
    return -6


LandIsolationTable = Dict[int, List[int]]

land_isolation_table: LandIsolationTable = {
    10: [45, 42, 38, 35, 30],
    15: [45, 42, 38, 33],
    20: [44, 41, 37, 32],
    25: [43, 40, 36, 31],
    30: [42, 39, 35, 30],
    40: [41, 38, 34],
    50: [40, 37, 33],
    65: [39, 36, 32],
    80: [38, 35, 31],
    100: [37, 34, 30],
    125: [36, 33],
    160: [35, 32],
    200: [34, 31],
    250: [33, 30],
    300: [32],
}

air_isolation_values: Dict[str, int] = {
    "A": 45,
    "B": 40,
    "C": 35,
    "D": 32,
}

isolation_correction_table: List[Dict[str, float]] = [
    {"maxGap": 1, "correction": 3},
    {"maxGap": 3, "correction": 2},
    {"maxGap": 9, "correction": 1},
    {"maxGap": float("inf"), "correction": 0},
]


def get_land_intersection_isolation(category: int, distance: float, correction: int) -> int:
    """
    Returns the isolation value for a given sound category (1-based) at the
    nearest lower/equal distance bucket from the land_isolation_table.
    """
    distances = sorted(land_isolation_table.keys())

    if distance < distances[0]:
        isolations = land_isolation_table[distances[0]]
        return (isolations[category - 1] + correction) if 0 <= category - 1 < len(isolations) else 0

    for d in sorted(distances, reverse=True):
        if d <= distance:
            isolations = land_isolation_table[d]
            return (isolations[category - 1] + correction) if 0 <= category - 1 < len(isolations) else 0

    last_isolations = land_isolation_table[distances[0]]
    return (last_isolations[category - 1] + correction) if 0 <= category - 1 < len(last_isolations) else 0


def get_land_isolations(soundclassification_intersections: List) -> (int, int):
    """
    Returns the maximum isolation across all provided land intersections.
    If the list is empty, returns 30.
    """
    if not len(soundclassification_intersections):
        return 30, 30

    max_val = max(
        get_land_intersection_isolation(
            inter["acoustic_category"],
            inter["max_distance"],
            inter["farthest_correction"]
        )
        for inter in soundclassification_intersections
    )

    min_val = max(
        get_land_intersection_isolation(
            inter["acoustic_category"],
            inter["min_distance"],
            inter["closest_correction"]
        )
        for inter in soundclassification_intersections
    )

    max_val = max_val if max_val >= 30 else 30
    min_val = min_val if min_val >= 30 else 30

    return max_val, min_val


def get_air_isolation(air_intersections: List) -> int:
    """
    Returns the isolation value based on the highest-priority zone present.
    Priority order: A > B > C > D. If none are present, returns 0.
    """
    zone_priority = ["A", "B", "C", "D"]

    for zone in zone_priority:
        if any(item['acoustic_zone'] == zone for item in air_intersections):
            return air_isolation_values[zone]
    return 0


def _cumulative_correction(gap: float) -> int:
    """Additive correction for a given isolation gap (first matching rule wins)."""
    for rule in isolation_correction_table:
        if gap <= rule["maxGap"]:
            return int(rule["correction"])
    return 0


def _combine_isolations(isolations: List[int]) -> int:
    """
    Combine source isolations by iterating in ascending order:
    each step takes max(running, next) + correction(|running - next|).

    Example: [31, 33, 36, 38]
      31 vs 33 -> 33 + 2 = 35   (gap=2)
      35 vs 36 -> 36 + 3 = 39   (gap=1)
      39 vs 38 -> 39 + 3 = 42   (gap=1)
    """
    filtered = sorted(iso for iso in isolations if iso > 0)
    if not filtered:
        return 0

    result = filtered[0]
    for nxt in filtered[1:]:
        result = max(result, nxt) + _cumulative_correction(abs(result - nxt))
    return result


def compute_parcelle_isolations(
    soundclassification_intersections: List,
    air_intersections: List,
) -> Tuple[int, int]:
    """
    Returns (isolation_min, isolation_max):
      - isolation_min: required at the least-exposed point of the parcel
                       (uses max_distance / farthest_correction per source)
      - isolation_max: required at the most-exposed point of the parcel
                       (uses min_distance / closest_correction per source)

    Each entry of soundclassification_intersections is treated as a single
    source (the list is pre-deduplicated by codeinfra). The PEB zone counts
    as one additional source. Sources whose computed isolation is 0
    (category out of table at the given distance) are excluded from the cumul.
    A 30 dB floor is applied to the final combined value.
    """
    air_iso = get_air_isolation(air_intersections)

    iso_min_per_source = [
        get_land_intersection_isolation(
            inter["sound_category"],
            inter["max_distance"],
            inter["farthest_correction"],
        )
        for inter in soundclassification_intersections
    ]
    iso_max_per_source = [
        get_land_intersection_isolation(
            inter["sound_category"],
            inter["min_distance"],
            inter["closest_correction"],
        )
        for inter in soundclassification_intersections
    ]

    isolation_min = _combine_isolations(iso_min_per_source + [air_iso])
    isolation_max = _combine_isolations(iso_max_per_source + [air_iso])

    return max(isolation_min, 30), max(isolation_max, 30)
