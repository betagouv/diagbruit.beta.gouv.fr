{{ config(
    materialized='view',
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
    geom_idx,
    {{ transform_to_epsg_4326('geometry') }} AS geometry,
    area_m2,
    4326 AS srid,
    original_is_valid,
    original_validity_reason,
    is_valid_now,
    geometry_type
FROM {{ ref('int_topo_fixed') }}