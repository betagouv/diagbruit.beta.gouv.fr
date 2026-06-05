from dagster import StaticPartitionsDefinition

from dagster_project.defs.assets.noisemap.agglo._registry import AGGLO_TERRITORIES
from dagster_project.defs.assets.noisemap.infra._registry import INFRA_TERRITORIES
from dagster_project.defs.assets.noisemap.infra_fastlines._registry import FASTLINE_TERRITORIES
from dagster_project.defs.assets.soundclassification._registry import SOUNDCLASSIFICATION_TERRITORIES

ALL_DEPT_PARTITIONS = StaticPartitionsDefinition(sorted(
    {t.dept for t in AGGLO_TERRITORIES}
    | {t.dept for t in INFRA_TERRITORIES}
    | {t.dept for t in FASTLINE_TERRITORIES}
    | {t.dept for t in SOUNDCLASSIFICATION_TERRITORIES}
))
