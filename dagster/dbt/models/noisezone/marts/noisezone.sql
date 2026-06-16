{{ config(
    materialized='table'
) }}

SELECT
  ROW_NUMBER() OVER (ORDER BY codedept, label, alert_slug) AS id,
  label,
  codedept,
  alert_slug,
  geometry

FROM {{ ref('int_noisezone_projected') }}