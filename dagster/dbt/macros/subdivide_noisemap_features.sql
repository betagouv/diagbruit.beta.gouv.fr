{#
  Build the noisemap mart with each contour split into pieces of at most
  `max_vertices` vertices.

  The id is minted in the CTE, BEFORE the split, so every piece of a contour carries
  its parent's id. That is what lets consumers regroup pieces with `GROUP BY id` and
  recover exactly the undivided feature. `MATERIALIZED` is load-bearing: without it
  Postgres may inline the CTE and evaluate nextval() once per output piece instead of
  once per contour, which would hand every piece a different id.

  Pieces tile the parent without overlap (they share edges, zero-area intersection),
  so `SUM(ST_Area(ST_Intersection(piece, probe)))` equals the area the undivided
  polygon would have given, and an ST_Intersects test returns the same answer.
#}
{% macro subdivide_noisemap_features(source, max_vertices=256) %}
WITH features AS MATERIALIZED (
    SELECT
        CAST(nextval('{{ this.schema }}.{{ this.name }}_id_seq') AS INTEGER) AS id,
        campaign,
        codedept,
        acoustic_producer_kind,
        label,
        kind,
        acoustic_noisemap_kind,
        CAST(acoustic_db_value AS float) AS acoustic_db_value,
        acoustic_time_range,
        geometry
    FROM {{ source }}
    WHERE COALESCE(area_m2, 0) > 0.0
    {#
      Not gated on is_incremental(): on a first build the table does not exist yet,
      and gating it there would turn the next routine single-department run into a
      national subdivide.
    #}
    {% if var('codedept', none) is not none %}
      AND codedept = '{{ var("codedept") }}'
    {% endif %}
)

SELECT
    id,
    campaign,
    codedept,
    acoustic_producer_kind,
    label,
    kind,
    acoustic_noisemap_kind,
    acoustic_db_value,
    acoustic_time_range,
    ST_Subdivide(geometry, {{ max_vertices }}) AS geometry
FROM features
{% endmacro %}
