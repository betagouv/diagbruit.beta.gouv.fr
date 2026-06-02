{{ config(
    materialized='view',
    schema='workspace'
) }}

WITH numbered AS (
    SELECT
        ROW_NUMBER() OVER (ORDER BY codedept, source, kind, label NULLS LAST) AS id,
        multilinestring,
        source,
        kind,
        label,
        acoustic_buffer,
        acoustic_category,
        codedept,
        original_is_valid,
        original_validity_reason,
        is_valid_now,
        area_m2,
        geometry_type,
        geom_idx,
        geometry
    FROM {{ ref('int_soundclassification_fixed_clean') }}
)

SELECT
    id,
    multilinestring,
    source,
    kind,
    COALESCE(label, 'NOM DE ROUTE INCONNU ' || id::text) AS label,
    acoustic_buffer,
    acoustic_category,
    codedept,
    original_is_valid,
    original_validity_reason,
    is_valid_now,
    area_m2,
    geometry_type,
    geom_idx,
    geometry
FROM numbered
