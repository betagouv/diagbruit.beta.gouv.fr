{{ config(
    materialized='table',
) }}

SELECT
    label,
    geometry,
    category_slug
FROM {{ ref('noisesource_stras') }}

UNION ALL

SELECT
    name AS label,
    geometry,
    category_slug
FROM {{ ref('int_osm_slug') }}
