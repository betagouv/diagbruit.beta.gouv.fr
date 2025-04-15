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


def get_parcelle_diagnostic(noisemap_intersections, soundclassification_intersections, peb_intersections):
    """
    Calculate the score for a parcel based on the intersections with the noise map.
    """
    diagnostic = {
        'score': 0,
        'classification_warning': False
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

    # Calculate gloabl ND score
    score_ln = score_land_ln

    # Apply a penalty if there is a constant noise on almost the same noise level
    base_score = max(score_ld, score_ln)
    score_diff = abs(score_ld - score_ln)

    penalty = {
        0: 2,
        1: 1
    }.get(score_diff, 0)

    print('---- LDEN -----')
    print('land score : ', score_land_ld)
    print('air score : ', score_air)
    print('global score : ', score_ld)
    print('---------------')
    print('---- LN -----')
    print('land score : ', score_land_ln)
    print('gloabl score : ', score_ln)
    print('---------------')
    print('penalty : ', penalty)
    print('final score : ', base_score + penalty)
    print('---------------')

    diagnostic['score'] = base_score + penalty

    return diagnostic
