{{ config(
    materialized='view',
    schema='workspace'
) }}

WITH geo_enriched AS (

    SELECT
        n.*,
        LPAD(d.code, 3, '0') AS codedept
    FROM {{ ref('stg_noisezone') }} n
    JOIN {{ source('public_workspace', 'geo_departements') }} d
        ON n.geometry && d.geometry
        AND ST_Intersects(d.geometry, n.geometry)

)

SELECT
    codedept,
    label,
    alert_slug,
    geometry
FROM geo_enriched
