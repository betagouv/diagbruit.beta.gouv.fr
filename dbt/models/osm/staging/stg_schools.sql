{{ config(
    schema='workspace',
) }}


SELECT 
    amenity,
    name,
    geometry

FROM {{ source('public_workspace', 'raw_full_osm_schools_data') }}