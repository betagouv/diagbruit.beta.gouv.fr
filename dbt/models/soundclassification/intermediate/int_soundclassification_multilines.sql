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
    typesource,
    codeinfra,
    buffer,
    sound_category,
    extra_fields
FROM unified
