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
    (ST_Dump(geometry::geometry)).geom AS geometry,
    (ST_Dump(geometry::geometry)).path[1] AS geom_idx
FROM {{ ref('stg_noisemap') }}
