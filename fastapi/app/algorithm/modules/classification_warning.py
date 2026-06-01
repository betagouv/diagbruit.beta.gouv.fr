def get_classification_warning(noisemap_intersections, soundclassification_intersections):
    """
    Return the classification warning boolean.
    """
    noisemap_kinds = {
        item["kind"]
        for item in noisemap_intersections
        if item.get("acoustic_noisemap_kind") == "A" and "kind" in item and item["kind"] in ['F', 'R']
    }
    classification_typesources = {item["typesource"] for item in soundclassification_intersections if "typesource" in item}
    return not noisemap_kinds.issubset(classification_typesources)
