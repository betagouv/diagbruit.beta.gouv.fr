"""A parcel crossed by no noise map, PEB or sound classification still gets a
full diagnostic: its PLU zones and nearby noise sources must not be dropped."""
from app.algorithm import get_parcelle_diagnostic
from app.routes.diag import Populate

NOISEZONE = {"alert_slug": "zone-calme", "label": "Zone PLU"}
NOISESOURCE = {"label": "Salle de concert", "distance": 120}


def _diagnose(soundclassification=None):
    return get_parcelle_diagnostic(
        noisemap_intersections=[],
        soundclassification_intersections=soundclassification or [],
        peb_intersections=[],
        noisesource_intersections=[NOISESOURCE],
        noisezone_intersections=[NOISEZONE],
        percent_unimpacted=1.0,
        populate=Populate(zones=False, isolation=True),
        geom_area_m2=1000.0,
    )


def test_plu_and_noise_sources_are_kept_without_any_noise_data():
    diagnostic = _diagnose()

    assert diagnostic["noisezone_intersections"] == [NOISEZONE]
    assert diagnostic["noisesource_intersections"] == [NOISESOURCE]
    assert diagnostic["score"] == 0
    # No sound classification: the sonoscore is not greyed out.
    assert diagnostic["flags"]["hasNoisemapWarning"] is False
    # Regulatory floor still applies.
    assert (diagnostic["isolation_min"], diagnostic["isolation_max"]) == (30, 30)


def test_sound_classification_only_keeps_greyed_sonoscore():
    soundclassification = [{
        "source": "route", "kind": "route", "label": "RD 1", "acoustic_category": 3,
        "min_distance": 20, "max_distance": 60,
        "closest_correction": 0, "farthest_correction": 0,
    }]
    diagnostic = _diagnose(soundclassification)

    assert diagnostic["noisezone_intersections"] == [NOISEZONE]
    assert diagnostic["score"] == 0
    # Sound classification without noise map or PEB: the sonoscore stays greyed out.
    assert diagnostic["flags"]["hasNoisemapWarning"] is True
