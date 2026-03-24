{{ config(
    schema='workspace',
) }}


SELECT 
    amenity,
    name,
    geometry

FROM {{ source('public_workspace', 'raw_full_schools_data') }}