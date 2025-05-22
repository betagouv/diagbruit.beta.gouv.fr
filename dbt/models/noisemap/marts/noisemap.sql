{{ config(
    materialized='table',
    post_hook=[
      "ALTER TABLE {{ this }} ADD COLUMN IF NOT EXISTS pk SERIAL PRIMARY KEY;",
      "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);"
      "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_codedept ON {{ this }} (codedept);"
    ]
) }}

SELECT
  id,
  idcbs,
  uueid,
  annee,
  codedept,
  typeterr,
  producteur,
  codeinfra,
  typesource,
  cbstype,
  zonedef,
  CAST(legende as float) AS legende,
  indicetype,
  validedeb,
  validefin,
  -- Generate a unique ID by concatenating existing ID with geometry index
  id || '_' || geom_idx AS polygon_id,
  geometry,
  area_m2,
  srid,
  -- Keep validation info for reference
  original_is_valid,
  original_validity_reason,
  is_valid_now,
  geometry_type
FROM {{ ref('int_noisemap_projected') }}
-- Only filter out zero-area geometries
WHERE COALESCE(area_m2, 0) > 0.0