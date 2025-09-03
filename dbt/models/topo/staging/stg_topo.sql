{{ config(
    materialized='table',
    post_hook=[
      "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);"
    ],
    schema='workspace'
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
    geometry

FROM {{ source('public_workspace', 'raw_topo') }}