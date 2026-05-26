{{ config(
    materialized='table',
    post_hook=[
        "ALTER TABLE {{ this }} ADD COLUMN IF NOT EXISTS pk SERIAL PRIMARY KEY;"
    ]
) }}

SELECT
  acoustic_zone,
  CASE 
    WHEN acoustic_db_value ~ '^[0-9]+(\.[0-9]+)?$' THEN CAST(acoustic_db_value AS float)
    ELSE NULL
  END AS acoustic_db_value,
  label,
  '2022' AS campaign,
  campaign_url,
  CAST(id_map || '_' || acoustic_zone AS TEXT) AS polygon_id,
  geometry

FROM {{ ref('int_peb_projected') }}
WHERE COALESCE(area_m2, 0) > 0.0