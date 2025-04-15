{{ config(
    materialized='view',
    schema='workspace'
) }}

WITH exploded AS (
    SELECT
        zone,
        legende,
        indldenext,
        indldenint,
        code_oaci,
        nom,
        date_arret,
        producteur,
        date_maj,
        ref_doc,
        id_map,
        geometry,
        original_is_valid,
        original_validity_reason,
        is_valid_now,
        area_m2,
        geometry_type,
        (ST_Dump(geometry::geometry)).geom AS geom,
        (ST_Dump(geometry::geometry)).path[1] AS geom_idx
    FROM {{ ref('int_peb_fixed') }}
)

SELECT
    zone,
    legende,
    indldenext,
    indldenint,
    code_oaci,
    nom,
    date_arret,
    producteur,
    date_maj,
    ref_doc,
    id_map,
    original_is_valid,
    original_validity_reason,
    is_valid_now,
    area_m2,
    geometry_type,
    geom as geometry
FROM exploded
WHERE GeometryType(geom) IN ('POLYGON', 'MULTIPOLYGON')
