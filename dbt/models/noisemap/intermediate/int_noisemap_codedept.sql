{{ config(
    materialized='view',
    schema='workspace'
) }}

WITH geo_enriched AS (

    SELECT 
        n.*,
        NULL AS inferred_codedept
    FROM {{ ref('int_noisemap_fixed_clean') }} n
    WHERE codedept IS NOT NULL

    UNION ALL

    SELECT 
        n.*,
        LPAD(d.code, 3, '0') AS inferred_codedept
    FROM {{ ref('int_noisemap_fixed_clean') }} n
    JOIN {{ source('public_workspace', 'geo_departements') }} d
        ON n.codedept IS NULL
        AND n.geometry && d.geometry
        AND ST_Intersects(d.geometry, n.geometry)
)

SELECT
    id,
    idcbs,
    uueid,
    annee,
    COALESCE(codedept, inferred_codedept) AS codedept,
    typeterr,
    producteur,
    codeinfra,
    typesource,
    cbstype,
    zonedef,
    legende,
    indicetype,
    validedeb,
    validefin,
    original_is_valid,
    original_validity_reason,
    is_valid_now,
    area_m2,
    geometry_type,
    geom_idx,
    geometry
FROM geo_enriched n
