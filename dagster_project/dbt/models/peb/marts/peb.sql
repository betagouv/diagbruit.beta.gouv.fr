{{ config(
    materialized='table'
) }}

SELECT
  ROW_NUMBER() OVER (ORDER BY id_map, acoustic_zone, label) AS id,
  acoustic_zone,
  CASE
    WHEN acoustic_db_value ~ '^[0-9]+(\.[0-9]+)?$' THEN CAST(acoustic_db_value AS float)
    ELSE NULL
  END AS acoustic_db_value,
  label,
  campaign,
  campaign_url,
  geometry

FROM {{ ref('int_peb_projected') }}
WHERE COALESCE(area_m2, 0) > 0.0
