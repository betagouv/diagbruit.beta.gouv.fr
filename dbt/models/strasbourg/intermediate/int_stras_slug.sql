{{ config(
    schema='workspace',
) }}

WITH full_stras AS (
    SELECT
        name,
        address,
        geometry
    FROM {{ ref('stg_stras') }}
)

SELECT
    name || ' | ' || address AS label,
    name,
    'BAR' AS category_slug,
    geometry
FROM full_stras

