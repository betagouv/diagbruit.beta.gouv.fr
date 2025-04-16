from .modules import (get_land_score_from_sources, get_air_score_from_sources, get_classification_warning)

def get_filtered_land_intersections(noisemap_intersections):
    """
    Get all the filtered arrays needed to calculate score in modules.
    """
    def filter_items(indicetype, typeterr):
        return [
            item for item in noisemap_intersections
            if item.get('typesource') in ['F', 'R']
            and item.get('indicetype') == indicetype
            and item.get('typeterr') == typeterr
        ]

    land_intersections_agglo_ld = filter_items('LD', 'AGGLO')
    land_intersections_infra_ld = filter_items('LD', 'INFRA')
    land_intersections_agglo_ln = filter_items('LN', 'AGGLO')
    land_intersections_infra_ln = filter_items('LN', 'INFRA')

    return (
        land_intersections_agglo_ld,
        land_intersections_agglo_ln,
        land_intersections_infra_ld,
        land_intersections_infra_ln
    )


def filter_land_intersections_by_codeinfra(intersections):
    filtered = {}

    for item in intersections:
        codeinfra = item.get('codeinfra')
        legende = item.get('legende')

        if codeinfra not in filtered or legende > filtered[codeinfra]['legende']:
            filtered[codeinfra] = item

    results = list(filtered.values())
    codeinfra_not_null = [item for item in results if item.get('codeinfra') is not None]

    if codeinfra_not_null:
        return codeinfra_not_null
    elif results:
        return [results[0]]
    else:
        return []

def filter_air_intersections_by_zone(intersections):
    if not intersections:
        return []

    return [min(intersections, key=lambda x: x.get("zone", "Z"))]


def get_parcelle_diagnostic(noisemap_intersections, soundclassification_intersections, peb_intersections):
    """
    Calculate the score for a parcel based on the intersections with the noise map.
    """
    diagnostic = {
        'score': 0,
        'classification_warning': False,
        'land_intersections_ld': [],
        'land_intersections_ln': [],
        'air_intersections': [],
        'flags': {
            'multiExposedSources': False,
            'multiExposedLdenLn': False,
            'isPriorityZone': False
        }
    }

    # If no intersection with noisemap return default output
    if len(noisemap_intersections) == 0 and len(peb_intersections) == 0:
        return diagnostic

    # Get the sound classification warning
    diagnostic['classification_warning'] = get_classification_warning(noisemap_intersections, soundclassification_intersections)

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

    # Flags : multiExposed
    diagnostic['flags']['multiExposedSources'] = len(diagnostic['land_intersections_ld'] + diagnostic['air_intersections']) > 1
    diagnostic['flags']['multiExposedLdenLn'] = len(diagnostic['land_intersections_ld'] + diagnostic['land_intersections_ln']) > 1
    diagnostic['flags']['isPriorityZone'] = any(item.get('cbstype') == "C" for item in noisemap_intersections)

    return diagnostic
