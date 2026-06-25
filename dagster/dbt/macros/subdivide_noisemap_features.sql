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
    {% if is_incremental() and var('codedept', none) is not none %}
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
