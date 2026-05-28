{{ config(
    materialized='table',
) }}

SELECT
    pk,
    source,
    kind,
    label,
    acoustic_buffer,
    acoustic_category,
    codedept,
    geometry,
    multilinestring as source_geometry
FROM {{ ref('int_soundclassification_merge') }}
WHERE area_m2 > 0
