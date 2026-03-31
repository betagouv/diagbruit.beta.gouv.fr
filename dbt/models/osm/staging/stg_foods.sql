{{ config(
    schema='workspace',
) }}


SELECT 
    name,
    type,
    LPAD(meta_code_dep, 3, '0') AS meta_code_dep,
    geometry

FROM {{ source('public_workspace', 'raw_full_osm_foods_data') }}