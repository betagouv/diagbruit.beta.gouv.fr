{{ config(
    materialized='table',
    post_hook=[
      "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);"
    ]
) }}

SELECT
  ROW_NUMBER() OVER (ORDER BY alert_slug) AS id,
  alert_slug,
  geometry

FROM {{ ref('int_noisezone_projected') }}
