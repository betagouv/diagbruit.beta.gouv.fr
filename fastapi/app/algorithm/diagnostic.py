import copy

from .modules import (group_intersections_by_identifier, get_classification_warning, get_zones_from_intersections, get_global_score_from_sources)
from .tools import (filter_soundclassification_by_label, get_filtered_land_intersections, get_sound_equivalents, default_diagnostic)
from ..utils import compute_parcelle_isolations


def get_parcelle_diagnostic(noisemap_intersections, soundclassification_intersections, peb_intersections, noisesource_intersections, noisezone_intersections, percent_unimpacted, populate, geom_area_m2=None):
    """
    Calculate the score for a parcel based on the intersections with the noise map.
    geom_area_m2: Area of the geometry in m² for zone percentage calculation
    """
    diagnostic = copy.deepcopy(default_diagnostic)

    if len(noisemap_intersections) == 0 and len(peb_intersections) == 0 and len(soundclassification_intersections) == 0:
        return diagnostic

    # Get global score
    diagnostic["score"] = get_global_score_from_sources(noisemap_intersections, peb_intersections, percent_unimpacted)

    # Get land intersections
    (
        intersections_AGGLO_ld,
        intersections_AGGLO_ln,
        intersections_INFRA_ld,
        intersections_INFRA_ln
    ) = get_filtered_land_intersections(noisemap_intersections)
    acoustic_producer_kind_order = {"INFRA": 0, "AGGLO": 1}
    diagnostic['land_intersections_ld'] = sorted(
        intersections_AGGLO_ld + intersections_INFRA_ld,
        key=lambda x: (
            -x["acoustic_db_value"],
            acoustic_producer_kind_order.get(x["acoustic_producer_kind"], 99)
        )
    )
    diagnostic['land_intersections_ln'] = sorted(
        intersections_AGGLO_ln + intersections_INFRA_ln,
        key=lambda x: (
            -x["acoustic_db_value"],
            acoustic_producer_kind_order.get(x["acoustic_producer_kind"], 99)
        )
    )

    # Return air intersections
    diagnostic['air_intersections'] = peb_intersections

    # Utils
    land_intersections_ld_cbs_A = [x for x in diagnostic['land_intersections_ld'] if x.get('acoustic_noisemap_kind') == 'A']
    land_intersections_ln_cbs_A = [x for x in diagnostic['land_intersections_ln'] if x.get('acoustic_noisemap_kind') == 'A']
    grouped_ld = group_intersections_by_identifier(land_intersections_ld_cbs_A)
    grouped_ln = group_intersections_by_identifier(land_intersections_ln_cbs_A)
    distinct_typesources = list(dict.fromkeys(s.lstrip()[0] for s in grouped_ld if s.strip()))

    # Return max db lden
    def _db_value(x):
        return x.get('acoustic_db_value') or 0

    all_sources = land_intersections_ld_cbs_A + diagnostic['air_intersections']
    diagnostic['max_db_lden'] = _db_value(max(all_sources, key=_db_value)) if len(all_sources) else 0
    diagnostic['min_db_lden'] = _db_value(min(all_sources, key=_db_value)) if len(all_sources) else 0

    # Return equivalent sound environments
    diagnostic['equivalent_ambiences'] = get_sound_equivalents(diagnostic['max_db_lden'])

    # Return soundclassification intersections
    diagnostic["soundclassification_intersections"] = filter_soundclassification_by_label(soundclassification_intersections)

    # Return noissources intersection
    diagnostic["noisesource_intersections"] = noisesource_intersections

    # Return noisezone intersections
    diagnostic["noisezone_intersections"] = noisezone_intersections

    # Return risk zones
    diagnostic["zones"] = get_zones_from_intersections(diagnostic['land_intersections_ld'], geom_area_m2=geom_area_m2) if populate.zones else []

    # Remove domination if the noise is stopped by a building
    low_risk_sum = sum(z.get("percentage_impacted", 0) for z in diagnostic["zones"] if z.get("risk") in [0, 1])
    high_risk_sum = sum(z.get("percentage_impacted", 0) for z in diagnostic["zones"] if z.get("risk") in [2, 3])
    noise_is_stopped = low_risk_sum < high_risk_sum
    
    if noise_is_stopped:
        diagnostic["score"] = get_global_score_from_sources(noisemap_intersections, peb_intersections, percent_unimpacted, noise_is_stopped)

    diagnostic["isolation_min"] = None
    diagnostic["isolation_max"] = None
    if populate.isolation:
        diagnostic["isolation_min"], diagnostic["isolation_max"] = compute_parcelle_isolations(
            diagnostic["soundclassification_intersections"],
            diagnostic["air_intersections"],
        )

    # Flags
    diagnostic['flags']['isMultiExposedSources'] = ((1 if len(grouped_ld) > 0 else 0) + (1 if len(diagnostic['air_intersections']) > 0 else 0)) > 1
    diagnostic['flags']['isMultiExposedLandSources'] = len(grouped_ld) > 1
    diagnostic['flags']['isMultiExposedLandDistinctTypeSources'] = len(distinct_typesources) > 1
    diagnostic['flags']['isMultiExposedLdenLn'] = (1 if len(grouped_ld) > 0 else 0) + (1 if len(grouped_ln) > 0 else 0) > 1
    diagnostic['flags']['isPriorityZone'] = any(item.get('acoustic_noisemap_kind') == "C" for item in noisemap_intersections)
    diagnostic['flags']['hasClassificationWarning'] = get_classification_warning(noisemap_intersections, soundclassification_intersections)
    diagnostic['flags']['hasNoisemapWarning'] = len(noisemap_intersections) == 0 and len(soundclassification_intersections) > 0 and len(peb_intersections) == 0

    return diagnostic
