{{ config(
    materialized='table',
    post_hook=[
      "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);"
    ],
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

    CASE
        WHEN cbstype IS NULL THEN
            CASE 
                WHEN CAST(REGEXP_SUBSTR(legende, '\d{2}') AS INTEGER) >= 70 THEN 'C'
                ELSE 'A'
            END
        ELSE cbstype
    END AS cbstype,

    zonedef,

    REGEXP_SUBSTR(legende, '\d{2}') AS legende,

    indicetype,
    validedeb,
    validefin,
    geometry

FROM {{ source('public_workspace', 'raw_noisemap') }}