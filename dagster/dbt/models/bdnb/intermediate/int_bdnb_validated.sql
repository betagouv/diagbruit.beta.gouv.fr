{{ config(
    materialized='view',
    schema='workspace'
) }}

WITH exploded_geometries AS (
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
        (ST_Dump(geometry)).geom AS geometry,
        (ST_Dump(geometry)).path[1] AS geom_idx
    FROM {{ ref('stg_bdnb') }}
)

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
    geom_idx,
    geometry,
    {{ validate_geometry('geometry') }}
FROM exploded_geometries