{{ config(
    materialized='view',
    schema='workspace'
) }}

WITH exploded AS (
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
        original_is_valid,
        original_validity_reason,
        is_valid_now,
        area_m2,
        geometry_type,
        (ST_Dump(geometry::geometry)).geom AS geom,
        (ST_Dump(geometry::geometry)).path[1] AS geom_idx
    FROM {{ ref('int_noisemap_fixed') }}
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
    original_is_valid,
    original_validity_reason,
    is_valid_now,
    area_m2,
    geometry_type,
    geom_idx,
    geom AS geometry
FROM exploded
WHERE GeometryType(geom) IN ('POLYGON', 'MULTIPOLYGON')
