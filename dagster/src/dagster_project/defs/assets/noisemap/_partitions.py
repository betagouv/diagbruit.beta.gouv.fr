from dagster_project.defs.assets._partitions import ALL_DEPT_PARTITIONS

from dagster_project.defs.assets.noisemap.agglo._registry import AGGLO_TERRITORIES
from dagster_project.defs.assets.noisemap.infra._registry import INFRA_TERRITORIES
from dagster_project.defs.assets.noisemap.infra_fastlines._registry import FASTLINE_TERRITORIES


def _depts(registry) -> list[str]:
    return sorted({t.dept for t in registry})


AGGLO_DEPTS = _depts(AGGLO_TERRITORIES)
INFRA_DEPTS = _depts(INFRA_TERRITORIES)
FASTLINE_DEPTS = _depts(FASTLINE_TERRITORIES)

NOISEMAP_ALL_DEPTS = sorted(set(AGGLO_DEPTS) | set(INFRA_DEPTS) | set(FASTLINE_DEPTS))

AGGLO_PARTITIONS = ALL_DEPT_PARTITIONS
INFRA_PARTITIONS = ALL_DEPT_PARTITIONS
FASTLINE_PARTITIONS = ALL_DEPT_PARTITIONS
