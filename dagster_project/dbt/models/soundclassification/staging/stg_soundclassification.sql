{{ config(
    materialized='table',
    schema='workspace'
) }}

SELECT
    geometry,
    'tramway' AS source,
    'F' AS kind,
    label,
    CAST(acoustic_buffer AS double precision),
    CAST(acoustic_category AS int),
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_tramway') }}

UNION ALL

SELECT
    geometry,
    'fer' AS source,
    'F' AS kind,
    label,
    CAST(acoustic_buffer AS double precision),
    CAST(acoustic_category AS int),
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_fer') }}
WHERE acoustic_category IS NOT NULL

UNION ALL

SELECT
    geometry,
    'routier' AS source,
    'R' AS kind,
    TRIM(SPLIT_PART(numero, ':', 1)) AS label,
    CAST(acoustic_buffer AS double precision),
    CAST(acoustic_category AS int),
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_routier') }}

UNION ALL

SELECT
    geometry,
    'lgv' AS source,
    'F' AS kind,
    label,
    CAST(acoustic_buffer AS double precision),
    CAST(acoustic_category AS int),
    codedept
FROM {{ source('public_workspace', 'raw_soundclassification_lgv') }}
