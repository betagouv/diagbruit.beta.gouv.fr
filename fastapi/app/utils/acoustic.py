# acoustic.py

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


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
            inter["sound_category"],
            inter["max_distance"],
            inter["farthest_correction"]
        )
        for inter in soundclassification_intersections
    )

    min_val = max(
        get_land_intersection_isolation(
            inter["sound_category"],
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
        if any(item['zone'] == zone for item in air_intersections):
            return air_isolation_values[zone]

    return 0


def get_computed_isolation(land_isolation: int, air_isolation: int) -> int:
    """
    Combines land and air isolation using the correction table. Add the topo correction.
    """
    max_isolation = max(land_isolation, air_isolation)
    min_isolation = min(land_isolation, air_isolation)
    gap = max_isolation - min_isolation

    tmp_correction = 0
    for rule in isolation_correction_table:
        if gap <= rule["maxGap"]:
            tmp_correction = int(rule["correction"])

    return int(max_isolation + tmp_correction)
