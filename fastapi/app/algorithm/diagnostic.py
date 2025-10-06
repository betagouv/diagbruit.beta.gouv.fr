import copy

from .modules import (get_land_score_from_sources, get_air_score_from_sources, group_intersections_by_identifier, get_classification_warning, get_zones_from_intersections)
from .tools import (filter_land_intersections_by_codeinfra, filter_soundclassification_by_codeinfra, get_filtered_land_intersections, get_sound_equivalents, default_diagnostic)
from ..utils import (get_land_isolations, get_air_isolation, get_computed_isolation)


def get_parcelle_diagnostic(noisemap_intersections, soundclassification_intersections, peb_intersections, percent_unimpacted, populate):
    """
    Calculate the score for a parcel based on the intersections with the noise map.
    """
    diagnostic = copy.deepcopy(default_diagnostic)

    # If no intersection with noisemap return default output
    if len(noisemap_intersections) == 0 and len(peb_intersections) == 0:
        return diagnostic

    # Calculate scores on LAND (for LN & LD)
    (
        intersections_AGGLO_ld,
        intersections_AGGLO_ln,
        intersections_INFRA_ld,
        intersections_INFRA_ln
    ) = get_filtered_land_intersections(noisemap_intersections)
    score_land_ld = get_land_score_from_sources(intersections_AGGLO_ld, intersections_INFRA_ld, 'LD', percent_unimpacted)
    score_land_ln = get_land_score_from_sources(intersections_AGGLO_ln, intersections_INFRA_ln, 'LN', percent_unimpacted)

    # Calculate score on AIR
    score_air = get_air_score_from_sources(peb_intersections)

    # Calculate global LDEN score
    diff_score_land_air = abs(score_land_ld - score_air)
    score_ld = max(score_land_ld, score_air) if diff_score_land_air >= 3 else max(score_land_ld, score_air) + 1

    # Calculate gloabl LN score
    score_ln = score_land_ln

    # Apply a penalty if there is a constant noise on almost the same noise level
    base_score = max(score_ld, score_ln)
    score_diff = abs(score_ld - score_ln)
    penalty = 1 if base_score >= 4 and score_diff <= 1 else 0

    # Return the final score
    diagnostic['score'] = base_score + penalty

    # Return land intersections
    typeterr_order = {"INFRA": 0, "AGGLO": 1}
    diagnostic['land_intersections_ld'] = sorted(
        intersections_AGGLO_ld + intersections_INFRA_ld,
        key=lambda x: (
            -x["legende"],
            typeterr_order.get(x["typeterr"], 99)
        )
    )
    diagnostic['land_intersections_ln'] = sorted(
        intersections_AGGLO_ln + intersections_INFRA_ln,
        key=lambda x: (
            -x["legende"],
            typeterr_order.get(x["typeterr"], 99)
        )
    )

    # Return air intersections
    diagnostic['air_intersections'] = peb_intersections

    # Utils
    land_intersections_ld_cbs_A = [x for x in diagnostic['land_intersections_ld'] if x.get('cbstype') == 'A']
    land_intersections_ln_cbs_A = [x for x in diagnostic['land_intersections_ln'] if x.get('cbstype') == 'A']
    grouped_ld = group_intersections_by_identifier(land_intersections_ld_cbs_A)
    grouped_ln = group_intersections_by_identifier(land_intersections_ln_cbs_A)
    distinct_typesources = list(dict.fromkeys(s.lstrip()[0] for s in grouped_ld if s.strip()))

    # Return max db lden
    all_sources = land_intersections_ld_cbs_A + diagnostic['air_intersections']
    diagnostic['max_db_lden'] = max(
        all_sources,
        key=lambda x: x['legende']
    )['legende'] if len(all_sources) else 0
    diagnostic['min_db_lden'] = min(
        all_sources,
        key=lambda x: x['legende']
    )['legende'] if len(all_sources) else 0

    # Return equivalent sound environments
    diagnostic['equivalent_ambiences'] = get_sound_equivalents(diagnostic['max_db_lden'])

    # Return noisemap intersections
    diagnostic["soundclassification_intersections"] = filter_soundclassification_by_codeinfra(soundclassification_intersections)

    # Return the big zones of risks
    diagnostic["zones"] = get_zones_from_intersections(diagnostic['land_intersections_ld']) if populate.zones else []

    # Return the isolation interval
    diagnostic["isolation_min"] = None
    diagnostic["isolation_max"] = None
    if populate.isolation:
        (land_isolation_min, land_isolation_max) = get_land_isolations(diagnostic["soundclassification_intersections"])
        air_isolation = get_air_isolation(diagnostic['air_intersections'])
        diagnostic["isolation_min"] = get_computed_isolation(land_isolation_min, air_isolation)
        diagnostic["isolation_max"] = get_computed_isolation(land_isolation_max, air_isolation)

    # Flags
    diagnostic['flags']['isMultiExposedSources'] = ((1 if len(grouped_ld) > 0 else 0) + (1 if len(diagnostic['air_intersections']) > 0 else 0)) > 1
    diagnostic['flags']['isMultiExposedLandSources'] = len(grouped_ld) > 1
    diagnostic['flags']['isMultiExposedLandDistinctTypeSources'] = len(distinct_typesources) > 1
    diagnostic['flags']['isMultiExposedLdenLn'] = (1 if len(grouped_ld) > 0 else 0) + (1 if len(grouped_ln) > 0 else 0) > 1
    diagnostic['flags']['isPriorityZone'] = any(item.get('cbstype') == "C" for item in noisemap_intersections)
    diagnostic['flags']['hasClassificationWarning'] = get_classification_warning(noisemap_intersections, soundclassification_intersections)

    return diagnostic
