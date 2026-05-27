{{ config(
    materialized='table',
    post_hook=[
      "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);"
    ],
    schema='workspace'
) }}


SELECT
    id,
    campaign,
    codedept,
    acoustic_producer_kind,
    label,
    kind,
    acoustic_noisemap_kind,
    REGEXP_SUBSTR(acoustic_db_value, '\d{2}') AS acoustic_db_value,
    acoustic_time_range,
    geometry

FROM {{ source('public_workspace', 'raw_noisemap') }}
WHERE (acoustic_time_range = 'LN' AND CAST(REGEXP_SUBSTR(acoustic_db_value, '\d{2}') AS INTEGER) >= 50)
   OR (acoustic_time_range = 'LD' AND CAST(REGEXP_SUBSTR(acoustic_db_value, '\d{2}') AS INTEGER) >= 55)
