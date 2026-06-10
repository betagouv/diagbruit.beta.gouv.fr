{{ config(
    schema='workspace',
) }}

WITH full_schools AS (
    SELECT
        name,
        amenity,
        geometry
    FROM {{ ref('stg_schools') }}
)

SELECT
    name,
    amenity,
    geometry
FROM full_schools
WHERE name IS NOT null