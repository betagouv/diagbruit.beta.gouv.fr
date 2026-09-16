from dagster import StaticPartitionsDefinition

# Every department Etalab publishes a cadastre extract for (101), listed at
# https://files.data.gouv.fr/cadastre/etalab-cadastre/<release>/shp/departements/
# Cadastre is national by nature, so it does NOT reuse ALL_DEPT_PARTITIONS (the
# union of noise-territory registries): parcelle coverage has to be able to run
# ahead of noisemap coverage. Materialising all 101 partitions pulls ~20 GB of ZIPs.
ETALAB_DEPT_CODES = [
    "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "21",
    "22", "23", "24", "25", "26", "27", "28", "29", "2A", "2B",
    "30", "31", "32", "33", "34", "35", "36", "37", "38", "39",
    "40", "41", "42", "43", "44", "45", "46", "47", "48", "49",
    "50", "51", "52", "53", "54", "55", "56", "57", "58", "59",
    "60", "61", "62", "63", "64", "65", "66", "67", "68", "69",
    "70", "71", "72", "73", "74", "75", "76", "77", "78", "79",
    "80", "81", "82", "83", "84", "85", "86", "87", "88", "89",
    "90", "91", "92", "93", "94", "95",
    "971", "972", "973", "974", "976",
]


def to_partition_key(etalab_code: str) -> str:
    """Etalab 2-char code -> the 3-char codedept used everywhere else ("33" -> "033")."""
    return etalab_code.zfill(3) if len(etalab_code) < 3 else etalab_code


def to_etalab_code(partition_key: str) -> str:
    """Inverse of `to_partition_key` ("033" -> "33", "02A" -> "2A", "971" -> "971")."""
    return partition_key[1:] if len(partition_key) == 3 and partition_key[0] == "0" else partition_key


CADASTRE_PARTITIONS = StaticPartitionsDefinition(
    sorted(to_partition_key(code) for code in ETALAB_DEPT_CODES)
)
