{{ config(
    schema='workspace',
) }}

WITH full_schools_filtered AS (
    SELECT
        name,
        amenity,
        geometry
    FROM {{ ref('int_schools_filter') }}
),

departments AS (
    SELECT
        code,
        geometry
    FROM {{ source('public_workspace', 'geo_departements') }}
)

SELECT
    s.name,
    s.amenity,
    s.geometry,
    LPAD(d.code, 3, '0') AS codedept
FROM full_schools_filtered s
JOIN departments d
    ON ST_Within(ST_Transform(s.geometry, 2154), d.geometry)
