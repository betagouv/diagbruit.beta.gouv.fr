{{ config(
    materialized='view',
    schema='workspace'
) }}

SELECT
    campaign,
    codedept,
    acoustic_producer_kind,
    label,
    kind,
    acoustic_noisemap_kind,
    acoustic_db_value,
    acoustic_time_range,
    geom_idx,
    {{ transform_to_epsg_4326('geometry') }} AS geometry,
    original_is_valid,
    original_validity_reason,
    is_valid_now,
    area_m2,
    geometry_type,
    4326 AS srid,
    ST_SRID(geometry) AS original_srid
FROM {{ ref('int_noisemap_fixed_clean') }}