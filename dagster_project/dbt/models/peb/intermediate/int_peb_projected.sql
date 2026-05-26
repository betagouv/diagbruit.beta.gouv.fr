{{ config(
    materialized='view',
    schema='workspace'
) }}

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
    {{ transform_to_epsg_4326('geometry', 3857) }} AS geometry,
    original_is_valid,
    original_validity_reason,
    is_valid_now,
    area_m2,
    geometry_type,
    4326 AS srid,
    ST_SRID(geometry) AS original_srid

FROM {{ ref('int_peb_fixed_clean') }}
