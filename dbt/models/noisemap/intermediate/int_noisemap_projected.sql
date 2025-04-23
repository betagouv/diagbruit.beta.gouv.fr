{{ config(
    materialized='view',
    schema='workspace'
) }}

SELECT
    id,
    idcbs,
    uueid,
    annee,
    codedept,
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
    geom_idx,
    -- Transform geometry to EPSG:4326 (WGS84)
    {{ transform_to_epsg_4326('geometry') }} AS geometry,
    original_is_valid,
    original_validity_reason,
    is_valid_now,
    area_m2,
    geometry_type,
    -- Add SRID info for reference
    4326 AS srid,
    ST_SRID(geometry) AS original_srid
FROM {{ ref('int_noisemap_fixed_clean') }}