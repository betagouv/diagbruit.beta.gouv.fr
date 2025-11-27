def get_classification_warning(noisemap_intersections, soundclassification_intersections):
    """
    Return the classification warning boolean.
    """
    noisemap_typesources = {
        item["typesource"]
        for item in noisemap_intersections
        if item.get("cbstype") == "A" and "typesource" in item and item["typesource"] in ['F', 'R']
    }
    classification_typesources = {item["typesource"] for item in soundclassification_intersections if "typesource" in item}
    return not noisemap_typesources.issubset(classification_typesources)