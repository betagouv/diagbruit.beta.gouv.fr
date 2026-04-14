{{ config(
    materialized='table',
    schema='workspace'
) }}

SELECT
    geometry,
    'tramway' AS source,
    'F' AS typesource,
    id AS codeinfra,
    larg_secte AS buffer,
    categorie as sound_category,
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_tramway') }}

UNION ALL

SELECT
    geometry,
    'fer' AS source,
    'F' AS typesource,
    ligne AS codeinfra,
    CAST(sect_affec AS bigint) AS buffer,
    CAST(rang AS int) as sound_category,
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_fer') }}
WHERE rang IS NOT NULL 
    AND rang ~ '^[0-9]+$'

UNION ALL

SELECT
    geometry,
    'routier' AS source,
    'R' AS typesource,
    TRIM(SPLIT_PART(numero, ':', 1)) AS codeinfra,
    larg_secte AS buffer,
    cat_bruit as sound_category,
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_routier') }}

UNION ALL

SELECT
    geometry,
    'lgv' AS source,
    'F' AS typesource,
    toponyme AS codeinfra,
    larg_secte AS buffer,
    cat as sound_category,
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_lgv') }}
