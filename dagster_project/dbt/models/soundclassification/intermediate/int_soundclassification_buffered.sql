{{ config(
    materialized='view',
    schema='workspace'
) }}

WITH reprojected AS (
    SELECT *,
           ST_Transform(multilinestring, 2154) AS geom_lambert,
           CASE
               WHEN buffer IS NULL THEN
                   CASE sound_category
                       WHEN 1 THEN 300
                       WHEN 2 THEN 250
                       WHEN 3 THEN 100
                       WHEN 4 THEN 30
                       WHEN 5 THEN 10
                       ELSE NULL
                   END
               ELSE buffer
           END AS buffer_filled
    FROM {{ ref('int_soundclassification_multilines') }}
),
buffered AS (
    SELECT *,
           ST_Transform(ST_Buffer(geom_lambert, buffer_filled), 4326) AS polygon_geom
    FROM reprojected
    WHERE buffer_filled IS NOT NULL AND buffer_filled > 0
)

SELECT
    multilinestring,
    polygon_geom,
    source,
    typesource,
    codeinfra,
    buffer_filled AS buffer,
    sound_category,
    codedept
FROM buffered
