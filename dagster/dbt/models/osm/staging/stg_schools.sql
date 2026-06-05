{{ config(
    schema='workspace',
) }}


SELECT
    amenity,
    name,
    ST_Transform(geometry, 4326) AS geometry

FROM {{ source('public_workspace', 'raw_full_osm_schools_data') }}