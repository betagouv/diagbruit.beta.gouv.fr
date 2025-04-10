def get_parcelle_score(noisemap_intersections, soundclassification_intersections):
    """
    Calculate the score for a parcel based on the intersections with the noise map.
    """
    score = 0
    classification_warning = False

    if len(noisemap_intersections) != 0:
        # Get distinct typesource values from the noise map intersections
        noisemap_typesources = {
            item["typesource"]
            for item in noisemap_intersections
            if item.get("typeterr") == "INFRA" and "typesource" in item
        }

        # Get distinct typesource values from the sound classification intersections
        classification_typesources = {item["typesource"] for item in soundclassification_intersections if "typesource" in item}

        # If not all noisemap typesources are represented in sound classification, raise a warning
        if not noisemap_typesources.issubset(classification_typesources):
            classification_warning = True

        score += len(noisemap_intersections)

        # for i in noisemap_intersections:
        #     i_without_geometry = {k: v for k, v in i.items() if k != 'geometry_wkt' and k != 'geometry'}
        #     print(i_without_geometry['codinfra'] + ' / ' + i_without_geometry['cbstype'] + ' / ' + i_without_geometry['indicetype'] + ' / ' + str(i_without_geometry['legende']))

    return {
        'score': score,
        'classification_warning': classification_warning
    }
