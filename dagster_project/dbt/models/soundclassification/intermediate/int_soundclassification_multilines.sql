{{ config(
    materialized='view',
    schema='workspace'
) }}

WITH unified AS (
    SELECT *,
           CASE 
             WHEN GeometryType(geometry) = 'LINESTRING' 
             THEN ST_Multi(geometry)
             ELSE geometry
           END AS multilinestring
    FROM {{ ref('stg_soundclassification') }}
)

SELECT
    geometry,
    multilinestring,
    source,
    kind,
    label,
    acoustic_buffer,
    acoustic_category,
    codedept
FROM unified
