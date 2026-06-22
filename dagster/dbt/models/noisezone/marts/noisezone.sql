{{ config(
    materialized='table'
) }}

SELECT
  ROW_NUMBER() OVER (ORDER BY alert_slug) AS id,
  alert_slug,
  geometry

FROM {{ ref('int_noisezone_projected') }}
