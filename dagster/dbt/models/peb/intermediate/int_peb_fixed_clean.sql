{{ config(
    materialized='view',
    schema='workspace'
) }}

WITH exploded AS (
    SELECT
        acoustic_zone,
        acoustic_db_value,
        indldenext,
        indldenint,
        code_oaci,
        label,
        date_arret,
        producteur,
        date_maj,
        campaign_url,
        id_map,
        campaign,
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
    acoustic_zone,
    acoustic_db_value,
    indldenext,
    indldenint,
    code_oaci,
    label,
    date_arret,
    producteur,
    date_maj,
    campaign_url,
    id_map,
    campaign,
    original_is_valid,
    original_validity_reason,
    is_valid_now,
    area_m2,
    geometry_type,
    geom as geometry
FROM exploded
WHERE GeometryType(geom) IN ('POLYGON', 'MULTIPOLYGON')
