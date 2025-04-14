from .modules import (get_tt_score_from_sources, get_classification_warning)

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


def get_parcelle_score(noisemap_intersections, soundclassification_intersections):
    """
    Calculate the score for a parcel based on the intersections with the noise map.
    """
    output = {
        'score': 0,
        'classification_warning': False
    }

    # If no intersection with noisemap return default output
    if len(noisemap_intersections) == 0:
        return output

    # Get the sound classification warning
    output['classification_warning'] = get_classification_warning(noisemap_intersections, soundclassification_intersections)

    # Calculate scores on TT (for LN & LD)
    (
        intersections_AGGLO_ld,
        intersections_AGGLO_ln,
        intersections_INFRA_ld,
        intersections_INFRA_ln
    ) = get_filtered_land_intersections(noisemap_intersections)
    score_tt_ld = get_tt_score_from_sources(intersections_AGGLO_ld, intersections_INFRA_ld, 'LD')
    score_tt_ln = get_tt_score_from_sources(intersections_AGGLO_ln, intersections_INFRA_ln, 'LN')

    # Apply a penalty if there is a constant noise on almost the same noise
    print(score_tt_ld)
    print(score_tt_ln)
    diff_score_ld_ln = abs(score_tt_ld - score_tt_ln)
    if diff_score_ld_ln == 0:
        output['score'] = max(score_tt_ld, score_tt_ln) + 2
    elif diff_score_ld_ln == 1:
        output['score'] = max(score_tt_ld, score_tt_ln) + 1
    else:
        output['score'] = max(score_tt_ld, score_tt_ln)

    return output
