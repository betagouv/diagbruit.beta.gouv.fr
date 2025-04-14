{{ config(
    materialized='table',
) }}

SELECT
    pk,
    source,
    typesource,
    codeinfra,
    buffer,
    sound_category,
    geometry,
    multilinestring as source_geometry
FROM {{ ref('int_soundclassification_merge') }}
WHERE area_m2 > 0
