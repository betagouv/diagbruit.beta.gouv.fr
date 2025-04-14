{{ config(
    materialized='view',
    schema='workspace'
) }}

WITH reprojected AS (
    SELECT *,
           ST_Transform(multilinestring, 2154) AS geom_lambert -- passage en Lambert 93 (mètres)
    FROM {{ ref('int_soundclassification_multilines') }}
),
buffered AS (
    SELECT *,
           ST_Transform(ST_Buffer(geom_lambert, buffer), 4326) AS polygon_geom
    FROM reprojected
    WHERE buffer IS NOT NULL AND buffer > 0
)

SELECT
    multilinestring,
    polygon_geom,
    source,
    typesource,
    codeinfra,
    buffer,
    sound_category,
    extra_fields
FROM buffered
