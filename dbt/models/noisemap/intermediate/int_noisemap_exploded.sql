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
    -- Extract each polygon from multipolygon (with index i)
    (ST_Dump(geometry::geometry)).geom AS geometry,
    (ST_Dump(geometry::geometry)).path[1] AS geom_idx
FROM {{ ref('stg_noisemap') }}
