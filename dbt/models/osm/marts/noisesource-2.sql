{{ config(
    materialized='table',
) }}


SELECT
    name as label,
    type,
    meta_code_dep,
    geometry,
    category_slug
FROM {{ ref('int_osm_merge') }}