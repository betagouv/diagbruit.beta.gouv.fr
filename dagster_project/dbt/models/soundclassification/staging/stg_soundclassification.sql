{{ config(
    materialized='table',
    schema='workspace'
) }}

SELECT
    geometry,
    'tramway' AS source,
    'F' AS kind,
    id AS codeinfra,
    larg_secte AS acoustic_buffer,
    categorie as acoustic_category,
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_tramway') }}

UNION ALL

SELECT
    geometry,
    'fer' AS source,
    'F' AS kind,
    ligne AS codeinfra,
    CAST(sect_affec AS bigint) AS acoustic_buffer,
    CAST(rang AS int) as acoustic_category,
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_fer') }}
WHERE rang IS NOT NULL 
    AND rang ~ '^[0-9]+$'

UNION ALL

SELECT
    geometry,
    'routier' AS source,
    'R' AS kind,
    TRIM(SPLIT_PART(numero, ':', 1)) AS codeinfra,
    larg_secte AS acoustic_buffer,
    cat_bruit as acoustic_category,
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_routier') }}

UNION ALL

SELECT
    geometry,
    'lgv' AS source,
    'F' AS kind,
    toponyme AS codeinfra,
    larg_secte AS acoustic_buffer,
    cat as acoustic_category,
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_lgv') }}
