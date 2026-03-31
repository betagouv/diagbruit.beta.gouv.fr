{{ config(
    schema='workspace',
) }}


SELECT 
    name,
    type,
    meta_code_dep,
    geometry

FROM {{ source('public_workspace', 'raw_full_osm_foods_data') }}