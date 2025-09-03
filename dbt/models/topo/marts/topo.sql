{{ config(
    materialized='table',
    post_hook=[
      "ALTER TABLE {{ this }} ADD COLUMN IF NOT EXISTS pk SERIAL PRIMARY KEY;",
      "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);",
      "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_nature ON {{ this }} (nature);"
    ]
) }}

SELECT
  id,
  nature,
  usage1,
  usage2,
  leger,
  etat,
  date_creat,
  date_maj,
  date_app,
  date_conf,
  source,
  id_source,
  acqu_plani,
  acqu_alti,
  prec_plani,
  prec_alti,
  nb_logts,
  nb_etages,
  mat_murs,
  mat_toits,
  hauteur,
  z_min_sol,
  z_min_toit,
  z_max_toit,
  z_max_sol,
  origin_bat,
  app_ff,
  ids_rnb,
  id || '_' || geom_idx AS polygon_id,
  geometry,
  area_m2,
  srid,
  original_is_valid,
  original_validity_reason,
  is_valid_now,
  geometry_type
FROM {{ ref('int_topo_projected') }}
WHERE COALESCE(area_m2, 0) > 0.0