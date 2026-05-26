{{ config(
    materialized='view',
    schema='workspace'
) }}

WITH exploded AS (
    SELECT
        id,
        idcbs,
        uueid,
        campaign,
        codedept,
        acoustic_producer_kind,
        producteur,
        codeinfra,
        kind,
        acoustic_noisemap_kind,
        zonedef,
        acoustic_db_value,
        acoustic_time_range,
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
    id,
    idcbs,
    uueid,
    campaign,
    codedept,
    acoustic_producer_kind,
    producteur,
    codeinfra,
    kind,
    acoustic_noisemap_kind,
    zonedef,
    acoustic_db_value,
    acoustic_time_range,
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
