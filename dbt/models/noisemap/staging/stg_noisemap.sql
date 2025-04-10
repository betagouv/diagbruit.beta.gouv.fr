{{ config(
    materialized='table',
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

UNION ALL

SELECT 
    NULL AS idzonbruit,
    NULL AS idcbs,
    NULL AS uueid,
    annee,
    codedept,
    'AGGLO' AS typeterr,
    NULL AS producteur,
    NULL AS codinfra,
    typesource,
    'C' AS cbstype,
    NULL AS zonedef,
    REGEXP_SUBSTR(category, '\\d+') AS legende,
    indicetype,
    NULL AS validedeb,
    NULL AS validefin,
    geometry
FROM {{ source('public_workspace', 'raw_noisemap_agglo_c') }}

UNION ALL

SELECT 
    NULL AS idzonbruit,
    NULL AS idcbs,
    NULL AS uueid,
    annee,
    codedept,
    'AGGLO' AS typeterr,
    NULL AS producteur,
    NULL AS codinfra,
    typesource,
    'A' AS cbstype,
    NULL AS zonedef,
    REGEXP_SUBSTR(category, '\\d+') AS legende,
    indicetype,
    NULL AS validedeb,
    NULL AS validefin,
    geometry
FROM {{ source('public_workspace', 'raw_noisemap_agglo_a') }}
