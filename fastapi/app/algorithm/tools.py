import yaml
from pathlib import Path
import unicodedata
import re
from collections import defaultdict

default_diagnostic = {
    'score': 0,
    'max_db_lden': 0,
    'min_db_lden': 0,
    'flags': {
        'hasClassificationWarning': False,
        'hasNoisemapWarning': False,
        'isMultiExposedSources': False,
        'isMultiExposedLandDistinctTypeSources': False,
        'isMultiExposedLdenLn': False,
        'isPriorityZone': False
    },
    'equivalent_ambiences': [],
    'land_intersections_ld': [],
    'land_intersections_ln': [],
    'air_intersections': [],
    'recommendations': [],
    'soundclassification_intersections': [],
    'noisesource_intersections': [],
    'noisezone_intersections': [],
}

DIRECTION_PRIORITIES = {
    "N":  {"N": 0, "NE": 1, "NW": 1},
    "NE": {"NE": 0, "N": 1, "E": 1},
    "E":  {"E": 0, "NE": 1, "SE": 1},
    "SE": {"SE": 0, "E": 1, "S": 1},
    "S":  {"S": 0, "SE": 1, "SW": 1},
    "SW": {"SW": 0, "S": 1, "W": 1},
    "W":  {"W": 0, "SW": 1, "NW": 1},
    "NW": {"NW": 0, "W": 1, "N": 1},
}


def get_filtered_land_intersections(noisemap_intersections):
    """
    Get all the filtered arrays needed to calculate score in modules.
    """
    def filter_items(acoustic_time_range, acoustic_producer_kind):
        return [
            item for item in noisemap_intersections
            if item.get('kind') in ['F', 'R']
            and item.get('acoustic_time_range') == acoustic_time_range
            and item.get('acoustic_producer_kind') == acoustic_producer_kind
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

def normalize_codeinfra(value):
    if not value:
        return ""
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('utf-8')
    value = value.lower()
    value = value.replace('-', ' ')
    value = re.sub(r'\s+', ' ', value).strip()
    return value


def filter_land_intersections_by_codeinfra(intersections):
    grouped_by_acoustic_noisemap_kind = defaultdict(dict)

    for item in intersections:
        acoustic_noisemap_kind = item.get('acoustic_noisemap_kind')
        codeinfra_raw = item.get('codeinfra')
        norm_codeinfra = normalize_codeinfra(codeinfra_raw)
        acoustic_db_value = item.get('acoustic_db_value')

        if not acoustic_noisemap_kind:
            continue

        if norm_codeinfra not in grouped_by_acoustic_noisemap_kind[acoustic_noisemap_kind] or \
           acoustic_db_value > grouped_by_acoustic_noisemap_kind[acoustic_noisemap_kind][norm_codeinfra]['acoustic_db_value']:
            grouped_by_acoustic_noisemap_kind[acoustic_noisemap_kind][norm_codeinfra] = item

    flatten_items = [
        item for codeinfra_dict in grouped_by_acoustic_noisemap_kind.values()
        for item in codeinfra_dict.values()
    ]

    flatten_items_not_null = [item for item in flatten_items if item.get('codeinfra') is not None]

    sorted_results = sorted(
        flatten_items_not_null if flatten_items_not_null else ([flatten_items[0]] if flatten_items else []),
        key=lambda x: x.get('acoustic_db_value', ''),
        reverse=True
    )

    return sorted_results


def filter_soundclassification_by_label(intersections):
    filtered = {}

    for item in intersections:
        label = item.get("label")
        if label and label not in filtered:
            filtered[label] = item

    return list(filtered.values())

def get_sound_equivalents(value):
    base_path_references = Path(__file__).resolve().parent.parent / "references"

    with open(base_path_references / "equivalent_sound_environments.yaml", "r", encoding="utf-8") as f:
        sound_equivalents = yaml.safe_load(f)

        return [
            item["label"]
            for item in sound_equivalents
            if item["value"] == value
        ]
