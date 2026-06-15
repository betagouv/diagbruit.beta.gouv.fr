{{ config(
    materialized='table'
) }}

SELECT
  label,
  codedept,
  alert_slug,
  geometry

FROM {{ ref('int_noisezone_codedept') }}