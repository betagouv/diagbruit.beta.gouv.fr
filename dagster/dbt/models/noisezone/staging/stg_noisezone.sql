{{ config(
    materialized='table',
    schema='workspace'
) }}

SELECT
    label,
    alert_slug,
    geometry
FROM {{ source('public_workspace', 'raw_noisezone') }}
