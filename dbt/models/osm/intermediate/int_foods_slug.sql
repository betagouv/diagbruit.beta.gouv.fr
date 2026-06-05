{{ config(
    schema='workspace',
) }}

WITH osm_validated AS (
    SELECT
        name,
        type,
        meta_code_dep,
        geometry
    FROM {{ ref('int_foods_validate') }}
)

SELECT
    name,
    type,
    meta_code_dep,
    geometry,
    CASE
        WHEN type = 'restaurant' THEN 'REST'
        WHEN type IN ('bar', 'pub') THEN 'BAR'
        ELSE NULL
    END AS category_slug

FROM osm_validated