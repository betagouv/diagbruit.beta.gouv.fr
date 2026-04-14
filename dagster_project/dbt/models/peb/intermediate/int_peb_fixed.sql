{{ config(
    materialized='view',
    schema='workspace'
) }}

WITH fixed_geometries AS (
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
        {{ repair_geometry('geometry', 'is_valid', 'structure') }} AS geometry,
        is_valid AS original_is_valid,
        validity_reason AS original_validity_reason
    FROM {{ ref('int_peb_validated') }}
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
    geometry,
    original_is_valid,
    original_validity_reason,
    ST_IsValid(geometry) AS is_valid_now,
    ST_Area(geometry) AS area_m2,
    ST_GeometryType(geometry) AS geometry_type
FROM fixed_geometries
