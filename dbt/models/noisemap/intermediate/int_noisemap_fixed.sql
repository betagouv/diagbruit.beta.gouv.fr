{{ config(
    materialized='view',
    schema='workspace'
) }}

WITH fixed_geometries AS (
    SELECT
        idzonbruit,
        idcbs,
        uueid,
        annee,
        codedept,
        typeterr,
        producteur,
        codinfra,
        typesource,
        cbstype,
        zonedef,
        legende,
        indicetype,
        validedeb,
        validefin,
        geom_idx,
        {{ repair_geometry('geometry', 'is_valid', 'structure') }} AS geometry,
        is_valid AS original_is_valid,
        validity_reason AS original_validity_reason
    FROM {{ ref('int_noisemap_validated') }}
)

SELECT
    idzonbruit,
    idcbs,
    uueid,
    annee,
    codedept,
    typeterr,
    producteur,
    codinfra,
    typesource,
    cbstype,
    zonedef,
    legende,
    indicetype,
    validedeb,
    validefin,
    geom_idx,
    geometry,
    original_is_valid,
    original_validity_reason,
    ST_IsValid(geometry) AS is_valid_now,
    ST_Area(geometry) AS area_m2,
    ST_GeometryType(geometry) AS geometry_type
FROM fixed_geometries