{{ config(
    materialized='view',
    schema='workspace'
) }}

SELECT
    id,
    idcbs,
    uueid,
    campaign,
    codedept,
    acoustic_producer_kind,
    producer,
    codeinfra,
    kind,
    acoustic_noisemap_kind,
    zonedef,
    acoustic_db_value,
    acoustic_time_range,
    validedeb,
    validefin,
    -- Extract each polygon from multipolygon (with index i)
    (ST_Dump(geometry::geometry)).geom AS geometry,
    (ST_Dump(geometry::geometry)).path[1] AS geom_idx
FROM {{ ref('stg_noisemap') }}
