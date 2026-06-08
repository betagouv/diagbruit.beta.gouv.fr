{{ config(
    schema='workspace',
) }}

WITH full_terrasses AS (
    SELECT
        name,
        address,
        codedept,
        geometry
    FROM {{ ref('stg_terrasses') }}
)

SELECT
    name || ' | ' || address AS label,
    name,
    'BAR' AS category_slug,
    codedept,
    geometry
FROM full_terrasses
