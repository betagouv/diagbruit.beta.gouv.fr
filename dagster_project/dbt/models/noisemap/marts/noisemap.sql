{{ config(
    materialized='table',
    post_hook=[
      "ALTER TABLE {{ this }} ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_geometry; CREATE INDEX idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_codedept; CREATE INDEX idx_{{ this.name }}_codedept ON {{ this }} (codedept);"
    ]
) }}

SELECT
  campaign,
  codedept,
  acoustic_producer_kind,
  label,
  kind,
  acoustic_noisemap_kind,
  CAST(acoustic_db_value AS float) AS acoustic_db_value,
  acoustic_time_range,
  geometry
FROM {{ ref('int_noisemap_projected') }}
WHERE COALESCE(area_m2, 0) > 0.0
