{{ config(
    schema='workspace',
) }}

WITH full_osm AS (
    SELECT
        name,
        type,
        meta_code_dep,
        geometry
    FROM {{ ref('stg_osm') }}
)

SELECT
    name,
    type,
    meta_code_dep,
    geometry
FROM full_osm
WHERE type IN ('restaurant', 'bar', 'pub') AND name IS NOT null