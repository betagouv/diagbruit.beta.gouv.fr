{{ config(
    materialized='table',
    schema='workspace'
) }}

SELECT
    geometry,
    'tramway' AS source,
    'F' AS kind,
    label,
    acoustic_buffer,
    acoustic_category,
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_tramway') }}

UNION ALL

SELECT
    geometry,
    'fer' AS source,
    'F' AS kind,
    label,
    CAST(sect_affec AS bigint),
    CAST(raacoustic_categoryng AS int),
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_fer') }}
WHERE rang IS NOT NULL 
    AND rang ~ '^[0-9]+$'

UNION ALL

SELECT
    geometry,
    'routier' AS source,
    'R' AS kind,
    TRIM(SPLIT_PART(numero, ':', 1)) AS label,
    acoustic_buffer,
    cat_bruit,
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_routier') }}

UNION ALL

SELECT
    geometry,
    'lgv' AS source,
    'F' AS kind,
    label,
    acoustic_buffer,
    acoustic_category,
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_lgv') }}
