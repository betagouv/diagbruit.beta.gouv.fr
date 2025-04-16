from .modules import (get_land_score_from_sources, get_air_score_from_sources, get_classification_warning)
from .tools import (filter_land_intersections_by_codeinfra, filter_air_intersections_by_zone, get_filtered_land_intersections, get_sound_equivalents, default_diagnostic)

def get_parcelle_diagnostic(noisemap_intersections, soundclassification_intersections, peb_intersections):
    """
    Calculate the score for a parcel based on the intersections with the noise map.
    """
    diagnostic = default_diagnostic

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
    score_land_ld = get_land_score_from_sources(intersections_AGGLO_ld, intersections_INFRA_ld, 'LD')
    score_land_ln = get_land_score_from_sources(intersections_AGGLO_ln, intersections_INFRA_ln, 'LN')

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

    penalty = {
        0: 2,
        1: 1
    }.get(score_diff, 0)

    # Return the final score
    diagnostic['score'] = base_score + penalty

    # Return land intersections with distinct codeinfra, take the max legende on several codeinfra matching
    diagnostic['land_intersections_ld'] = filter_land_intersections_by_codeinfra(intersections_AGGLO_ld + intersections_INFRA_ld)
    diagnostic['land_intersections_ln'] = filter_land_intersections_by_codeinfra(intersections_AGGLO_ln + intersections_INFRA_ln)

    # Return air intersection with the highest risk zone
    diagnostic['air_intersections'] = filter_air_intersections_by_zone(peb_intersections)

    # Return max db lden
    diagnostic['max_db_lden'] = max(
        diagnostic['land_intersections_ld'] + diagnostic['air_intersections'],
        key=lambda x: x['legende']
    )['legende']

    # Return equivalent sound environments
    diagnostic['equivalent_ambiences'] = get_sound_equivalents(diagnostic['max_db_lden'])

    # Return noisemap intersections
    diagnostic['soundclassification_intersections'] = soundclassification_intersections

    # Flags : multiExposed
    diagnostic['flags']['isMultiExposedSources'] = len(diagnostic['land_intersections_ld'] + diagnostic['air_intersections']) > 1
    diagnostic['flags']['isMultiExposedLdenLn'] = len(diagnostic['land_intersections_ld'] + diagnostic['land_intersections_ln']) > 1
    diagnostic['flags']['isPriorityZone'] = any(item.get('cbstype') == "C" for item in noisemap_intersections)
    diagnostic['flags']['hasClassificationWarning'] = get_classification_warning(noisemap_intersections, soundclassification_intersections)

    return diagnostic
