{{ config(
    materialized='table',
    post_hook=[
      "ALTER TABLE {{ this }} ADD COLUMN IF NOT EXISTS pk SERIAL PRIMARY KEY;",
      "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);",
      "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_batiment_c ON {{ this }} (batiment_c);"
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
  fictive_ge,
  fid || '_' || geom_idx AS polygon_id,
  geometry,
  area_m2,
  srid,
  original_is_valid,
  original_validity_reason,
  is_valid_now,
  geometry_type
FROM {{ ref('int_topo_projected') }}
WHERE COALESCE(area_m2, 0) > 0.0