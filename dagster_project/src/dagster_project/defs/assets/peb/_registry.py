from dataclasses import dataclass


@dataclass(frozen=True)
class PebTerritory:
    """One PEB ingestion config.

    Source: local SHP files in ingestion/inputs/{local_dir} → S3 → raw_peb.

    NB: PEB decrees are per-aerodrome, each carrying its own `date_arret` in
    the source row, so `campaign` is NOT part of this registry — it is derived
    per row from `date_arret` in dbt staging. Partitioning S3 by campaign
    would have grouped unrelated decrees under an arbitrary release tag.
    """

    scope: str        # "national"
    local_dir: str    # path under ingestion/inputs


PEB_TERRITORIES: list[PebTerritory] = [
    PebTerritory(
        scope="national",
        local_dir="PEB",
    ),
]
