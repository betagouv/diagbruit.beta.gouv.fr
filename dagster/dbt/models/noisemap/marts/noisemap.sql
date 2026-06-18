{{ config(
    materialized='incremental',
    incremental_strategy='delete+insert',
    unique_key='codedept',
    post_hook=[
      "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);",
      "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_codedept ON {{ this }} (codedept);"
    ]
) }}

SELECT
  CAST(codedept AS INTEGER) * 1000000
    + ROW_NUMBER() OVER (PARTITION BY codedept ORDER BY label, kind, acoustic_time_range, acoustic_noisemap_kind) AS id,
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
{% if is_incremental() and var('codedept', none) is not none %}
  AND codedept = '{{ var("codedept") }}'
{% endif %}
