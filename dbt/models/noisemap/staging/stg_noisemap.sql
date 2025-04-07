{{ config(
    materialized='view',
    schema='workspace'
) }}

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
    geometry
FROM {{ source('public_workspace', 'raw_noisemap') }}