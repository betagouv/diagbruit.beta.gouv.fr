{{ config(
    schema='workspace',
) }}

WITH full_schools_dep AS (
    SELECT
        name,
        amenity,
        codedept,
        geometry
    FROM {{ ref('int_schools_dep') }}
)

SELECT
    name,
    amenity,
    codedept,
    'SCH' as category_slug,
    geometry
FROM full_schools_dep