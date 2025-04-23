{{ config(
    materialized='table',
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
    REGEXP_SUBSTR(legende, '\d{2}') AS legende,
    indicetype,
    validedeb,
    validefin,
    geometry
FROM {{ source('public_workspace', 'raw_noisemap') }}