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
        'isMultiExposedSources': False,
        'isMultiExposedDistinctTypeSources': False,
        'isMultiExposedLdenLn': False,
        'isPriorityZone': False
    },
    'equivalent_ambiences': [],
    'land_intersections_ld': [],
    'land_intersections_ln': [],
    'air_intersections': [],
    'recommendations': [],
    'soundclassification_intersections': [],
}

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

def normalize_codeinfra(value):
    if not value:
        return ""
    # Lowercase, remove accents, replace dashes with space, remove extra spaces
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('utf-8')
    value = value.lower()
    value = value.replace('-', ' ')
    value = re.sub(r'\s+', ' ', value).strip()
    return value


def filter_land_intersections_by_codeinfra(intersections):
    grouped_by_cbstype = defaultdict(dict)

    for item in intersections:
        cbstype = item.get('cbstype')
        codeinfra_raw = item.get('codeinfra')
        norm_codeinfra = normalize_codeinfra(codeinfra_raw)
        legende = item.get('legende')

        if not cbstype:
            continue

        if norm_codeinfra not in grouped_by_cbstype[cbstype] or \
           legende > grouped_by_cbstype[cbstype][norm_codeinfra]['legende']:
            grouped_by_cbstype[cbstype][norm_codeinfra] = item

    flatten_items = [
        item for codeinfra_dict in grouped_by_cbstype.values()
        for item in codeinfra_dict.values()
    ]

    flatten_items_not_null = [item for item in flatten_items if item.get('codeinfra') is not None]

    sorted_results = sorted(
        flatten_items_not_null if flatten_items_not_null else ([flatten_items[0]] if flatten_items else []),
        key=lambda x: x.get('legende', ''),
        reverse=True
    )

    return sorted_results


def filter_soundclassification_by_codeinfra(intersections):
    filtered = {}

    for item in intersections:
        codeinfra = item.get("codeinfra")
        if codeinfra and codeinfra not in filtered:
            filtered[codeinfra] = item

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
