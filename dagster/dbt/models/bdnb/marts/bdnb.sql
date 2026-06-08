{{ config(
    materialized='table',
    post_hook=[
      "ALTER TABLE {{ this }} ADD COLUMN IF NOT EXISTS pk SERIAL PRIMARY KEY;",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_geometry; CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_batiment_c; CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_batiment_c ON {{ this }} (batiment_c);",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_is_valid_now; CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_is_valid_now ON {{ this }} (is_valid_now);",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_code_depar; CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_code_depar ON {{ this }} (code_depar);"
    ]
) }}

SELECT
  fid,
  batiment_c,
  batiment_g,
  code_depar,
  code_iris,
  code_commu,
  s_geom_cst,
  hauteur,
  altitude_s,
  fid || '_' || geom_idx AS polygon_id,
  geometry,
  area_m2,
  srid,
  original_is_valid,
  original_validity_reason,
  is_valid_now,
  geometry_type
FROM {{ ref('int_bdnb_projected') }}
WHERE COALESCE(area_m2, 0) > 0.0