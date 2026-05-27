"""Mapping helpers for agglo ingestion.

The actual @asset definitions live in `defs.py` — this module only holds the
per-territory mapping construction so the asset file stays focused on Dagster
wiring.
"""

from dagster_project.defs.assets.noisemap.agglo._registry import (
    AGGLO_TERRITORIES,
    AggloFile,
    AggloTerritory,
)

KIND = "agglo"
GROUP = "noisemap_agglo"
SOURCE = "box"

AGGLO_BY_DEPT: dict[str, AggloTerritory] = {t.dept: t for t in AGGLO_TERRITORIES}


def s3_prefix(t: AggloTerritory) -> str:
    return f"noisemap/cbs_{KIND}/territory={t.slug}/campaign={t.campaign}/"


def _file_mapping(t: AggloTerritory, f: AggloFile) -> dict:
    mapping = {
        "id": True,
        "geometry": True,
        "acoustic_db_value": {"from": t.legende_from},
        "kind": {"value": f.typesource},
        "acoustic_noisemap_kind": {"value": f.cbstype},
        "acoustic_time_range": {"value": f.indicetype},
        "campaign": {"value": t.annee},
        "codedept": {"value": t.dept},
        "acoustic_producer_kind": {"value": "AGGLO"},
        "codeinfra": {"value": ""},
        "idcbs": {"value": ""},
        "uueid": {"value": ""},
        "producer": {"value": ""},
        "zonedef": {"value": ""},
        "validedeb": {"value": ""},
        "validefin": {"value": ""},
    }
    if f.keep_source:
        mapping["source"] = True
    else:
        mapping["source"] = {"value": ""}
    return mapping


def build_territory_mapping(t: AggloTerritory) -> list[dict]:
    return [{"name": f.name, "mapping": _file_mapping(t, f)} for f in t.files]
