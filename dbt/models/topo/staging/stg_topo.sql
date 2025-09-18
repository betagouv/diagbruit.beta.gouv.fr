{{ config(
    materialized='table',
    post_hook=[
      "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);"
    ],
    schema='workspace'
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
    geometry

FROM {{ source('public_workspace', 'raw_topo') }}