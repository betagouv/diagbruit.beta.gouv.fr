def get_parcelle_score(noisemap_intersections, soundclassification_intersections):
    """
    Calculate the score for a parcel based on the intersections with the noise map.
    """
    if len(noisemap_intersections) == 0:
        return 0
    else:
        if len(soundclassification_intersections) == 0:
            print('ERROR SOMEWHERE!')
            return -1

    return 1