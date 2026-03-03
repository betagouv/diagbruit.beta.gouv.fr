{{ config(
    schema='workspace',
) }}

WITH osm_slugifyied AS (
    SELECT
        name,
        type,
        meta_code_dep,
        category_slug,
        geometry
    FROM {{ ref('int_osm_slug') }}
), stras as (
    SELECT
        name,
        geometry
    FROM {{ ref('stg_stras') }}
)

SELECT *
FROM osm_slugifyied

UNION ALL

SELECT name, 'bar' as type, '67' as meta_code_dep, 'BAR' as category_slug, geometry
FROM stras