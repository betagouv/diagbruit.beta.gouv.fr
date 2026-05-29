from dataclasses import dataclass


@dataclass(frozen=True)
class PebTerritory:
    """One PEB ingestion config.

    Source: local SHP files in ingestion/inputs/{local_dir} → S3 → raw_peb.
    `campaign` is both the S3 path partition value and the value injected as
    a row-level column at ingest time, so downstream dbt reads it from raw_peb
    instead of hard-coding it.
    """

    scope: str        # "national"
    campaign: str     # date de l'arrêté préfectoral (year for now)
    local_dir: str    # path under ingestion/inputs


PEB_TERRITORIES: list[PebTerritory] = [
    PebTerritory(
        scope="national",
        campaign="2023",
        local_dir="PEB",
    ),
]
