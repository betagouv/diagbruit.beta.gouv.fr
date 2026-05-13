"""Per-scope dept-keyed partition definitions for noisemap ingest.

Each source type (agglo, infra, fastline) has its OWN partition definition
sourced from its own registry. This keeps the partition grid clean — each
asset only shows the depts it can actually materialize.

Trade-off: a cross-scope job that selects assets from multiple scopes cannot
share a single partition picker (different `StaticPartitionsDefinition`
instances → Dagster treats them as incompatible). The shipped jobs work
around this by being per-scope (`agglo_ingest_job`, `infra_ingest_job`,
`fastline_ingest_job`). For ad-hoc "all-noisemap-for-dept-033", select the
relevant assets directly from the Assets page and hit Materialize.

`NOISEMAP_ALL_DEPTS` is exported for selections that need the union of every
dept across the three scopes (e.g. cross-scope ad-hoc filtering).
"""

from dagster import StaticPartitionsDefinition

from dagster_project.defs.assets.noisemap.agglo._registry import AGGLO_TERRITORIES
from dagster_project.defs.assets.noisemap.infra._registry import INFRA_TERRITORIES
from dagster_project.defs.assets.noisemap.infra_fastlines._registry import FASTLINE_TERRITORIES


def _depts(registry) -> list[str]:
    return sorted({t.dept for t in registry})


AGGLO_DEPTS = _depts(AGGLO_TERRITORIES)
INFRA_DEPTS = _depts(INFRA_TERRITORIES)
FASTLINE_DEPTS = _depts(FASTLINE_TERRITORIES)

NOISEMAP_ALL_DEPTS = sorted(set(AGGLO_DEPTS) | set(INFRA_DEPTS) | set(FASTLINE_DEPTS))

AGGLO_PARTITIONS = StaticPartitionsDefinition(AGGLO_DEPTS)
INFRA_PARTITIONS = StaticPartitionsDefinition(INFRA_DEPTS)
FASTLINE_PARTITIONS = StaticPartitionsDefinition(FASTLINE_DEPTS)
