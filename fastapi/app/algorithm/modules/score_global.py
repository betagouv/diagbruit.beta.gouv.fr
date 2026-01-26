from .score_land_transport import get_land_score_from_sources
from .score_air import get_air_score_from_sources
from ..tools import get_filtered_land_intersections


def get_global_score_from_sources(noisemap_intersections, peb_intersections, percent_unimpacted, exclude_domination=False):
    """
    Calculate the global diagnostic score from land and air intersections.
    
    Args:
        noisemap_intersections: List of noisemap intersections
        peb_intersections: List of PEB air intersections
        percent_unimpacted: Percentage of unimpacted area
        
    Returns:
        Final global score (int)
    """
    (
        intersections_AGGLO_ld,
        intersections_AGGLO_ln,
        intersections_INFRA_ld,
        intersections_INFRA_ln
    ) = get_filtered_land_intersections(noisemap_intersections)
    
    score_land_ld = get_land_score_from_sources(intersections_AGGLO_ld, intersections_INFRA_ld, 'LD', percent_unimpacted, exclude_domination)
    score_land_ln = get_land_score_from_sources(intersections_AGGLO_ln, intersections_INFRA_ln, 'LN', percent_unimpacted, exclude_domination)
    
    score_air = get_air_score_from_sources(peb_intersections)
    
    diff_score_land_air = abs(score_land_ld - score_air)
    score_ld = max(score_land_ld, score_air) if diff_score_land_air >= 3 else max(score_land_ld, score_air) + 1
    
    score_ln = score_land_ln
    
    base_score = max(score_ld, score_ln)
    score_diff = abs(score_ld - score_ln)
    penalty = 1 if base_score >= 4 and score_diff <= 1 else 0
    
    return base_score + penalty
