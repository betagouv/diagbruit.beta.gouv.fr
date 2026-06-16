{{ config(
    materialized='table'
) }}

SELECT
  ROW_NUMBER() OVER (ORDER BY codedept, alert_slug) AS id,
  codedept,
  alert_slug,
  geometry

FROM {{ ref('int_noisezone_projected') }}