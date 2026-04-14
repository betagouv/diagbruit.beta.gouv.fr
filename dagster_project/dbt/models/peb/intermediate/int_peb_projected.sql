{{ config(
    materialized='view',
    schema='workspace'
) }}

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
    {{ transform_to_epsg_4326('geometry', 3857) }} AS geometry,
    original_is_valid,
    original_validity_reason,
    is_valid_now,
    area_m2,
    geometry_type,
    4326 AS srid,
    ST_SRID(geometry) AS original_srid

FROM {{ ref('int_peb_fixed_clean') }}
