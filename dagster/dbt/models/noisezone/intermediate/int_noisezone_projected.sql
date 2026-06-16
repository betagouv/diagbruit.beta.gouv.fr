{{ config(
    materialized='view',
    schema='workspace'
) }}

SELECT
    codedept,
    alert_slug,
    {{ transform_to_epsg_4326('geometry', 2154) }} AS geometry,
    4326 AS srid,
    ST_SRID(geometry) AS original_srid

FROM {{ ref('int_noisezone_codedept') }}
