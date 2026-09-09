"""The diagnostic must not depend on the order intersections arrive in.

Nothing guarantees a stable row order out of PostgreSQL: no query in app/utils/db.py
carries an ORDER BY, so the order shifts with the plan, the statistics or the physical
layout of the table. A score that moves with it is a score that moves for no reason.
"""

import json
import random
from pathlib import Path

import pytest

from app.algorithm import get_parcelle_diagnostic

DATA = Path(__file__).resolve().parents[2] / "integration" / "diagnostic_from_geometries" / "data"
PERMUTATIONS = 200


class _Populate:
    def __init__(self, zones=True, isolation=False):
        self.zones = zones
        self.isolation = isolation


def _cases():
    for fixture in sorted(p.name for p in DATA.iterdir() if p.is_dir()):
        payload = json.loads((DATA / fixture / "output.json").read_text())
        for index, entry in enumerate(payload["diagnostics"]):
            diagnostic = entry["diagnostic"]
            noisemap = diagnostic["land_intersections_ld"] + diagnostic["land_intersections_ln"]
            if noisemap:
                yield pytest.param(noisemap, diagnostic["air_intersections"],
                                   diagnostic["score"], id=f"{fixture}[{index}]")


@pytest.mark.parametrize("noisemap,peb,expected_score", list(_cases()))
def test_score_is_independent_of_intersection_order(noisemap, peb, expected_score):
    rng = random.Random(0)
    scores = set()
    for _ in range(PERMUTATIONS):
        shuffled = noisemap[:]
        rng.shuffle(shuffled)
        scores.add(get_parcelle_diagnostic(
            shuffled, [], peb, [], [], 0.0, _Populate(), geom_area_m2=1000.0,
        )["score"])

    assert len(scores) == 1, f"score depends on input order: {sorted(scores)}"
    assert scores.pop() == expected_score
