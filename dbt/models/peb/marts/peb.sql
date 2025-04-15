{{ config(
    materialized='table',
    post_hook=[
        "ALTER TABLE {{ this }} ADD COLUMN IF NOT EXISTS pk SERIAL PRIMARY KEY;"
    ]
) }}

SELECT
  zone,
  CASE 
    WHEN legende ~ '^[0-9]+(\.[0-9]+)?$' THEN CAST(legende AS float)
    ELSE NULL
  END AS legende,
  indldenext,
  indldenint,
  code_oaci,
  nom,
  date_arret,
  producteur,
  date_maj,
  ref_doc,
  id_map,
  CAST(id_map || '_' || zone AS TEXT) AS polygon_id,
  geometry,
  area_m2,
  srid,
  original_is_valid,
  original_validity_reason,
  is_valid_now,
  geometry_type

FROM {{ ref('int_peb_projected') }}
WHERE COALESCE(area_m2, 0) > 0.0