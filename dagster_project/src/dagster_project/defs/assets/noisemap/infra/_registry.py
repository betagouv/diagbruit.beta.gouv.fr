from dataclasses import dataclass


@dataclass(frozen=True)
class InfraTerritory:
    """One CBS infra dept ingestion config.

    Source: data.gouv.fr ZIP → extracted shapefiles → S3 → raw_noisemap.
    No per-file mapping list: every shapefile in the ZIP goes through the
    default `rename_infra` callback (codinfra → codeinfra, idzonbruit → id).
    """

    dept: str       # "033", "044", ...
    campaign: str   # value used in S3 path partition campaign={campaign}
    url: str        # single data.gouv.fr ZIP URL


INFRA_TERRITORIES: list[InfraTerritory] = [
    InfraTerritory(
        dept="033",
        campaign="2022",
        url="https://www.data.gouv.fr/api/1/datasets/r/b4cf0f5e-4b99-4af3-916e-1d8c2625fce2",
    ),
    InfraTerritory(
        dept="044",
        campaign="2022",
        url="https://www.data.gouv.fr/api/1/datasets/r/e9b82009-955b-4997-bf1d-f6a542eadda3",
    ),
    InfraTerritory(
        dept="013",
        campaign="2022",
        url="https://www.data.gouv.fr/api/1/datasets/r/fbc62c62-3e77-4f6f-99fc-4ce45bc97ad7",
    ),
    InfraTerritory(
        dept="035",
        campaign="2022",
        url="https://www.data.gouv.fr/api/1/datasets/r/0e5b0406-2823-4d96-840c-fcc8f1cd53c0",
    ),
    InfraTerritory(
        dept="059",
        campaign="2022",
        url="https://www.data.gouv.fr/api/1/datasets/r/c7010c71-4ca3-4217-a5d7-8dc373b031f2",
    ),
    InfraTerritory(
        dept="067",
        campaign="2022",
        url="https://www.data.gouv.fr/api/1/datasets/r/6b1cb875-e134-4d92-88a0-32fb2abdc55d",
    ),
]
