{{ config(
    materialized='table',
) }}

SELECT
    id,
    source,
    kind,
    label,
    acoustic_buffer,
    acoustic_category,
    codedept,
    geometry,
    ST_Union(multilinestring) OVER (PARTITION BY source, kind, label, codedept) AS road_geometry
FROM {{ ref('int_soundclassification_merge') }}
WHERE area_m2 > 0
