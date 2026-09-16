{{ config(
    materialized='view',
    schema='workspace'
) }}

WITH validated AS (
    SELECT
        idu,
        code_insee,
        prefixe,
        section,
        numero,
        codedept,
        release,
        contenance,
        created,
        updated,
        geometry,
        {{ validate_geometry('geometry') }}
    FROM {{ ref('stg_parcelle') }}
),

fixed AS (
    SELECT
        idu,
        code_insee,
        prefixe,
        section,
        numero,
        codedept,
        release,
        contenance,
        created,
        updated,
        {{ repair_geometry('geometry', 'is_valid', 'structure') }} AS geometry,
        is_valid AS original_is_valid,
        validity_reason AS original_validity_reason
    FROM validated
)

SELECT
    idu,
    code_insee,
    prefixe,
    section,
    numero,
    codedept,
    release,
    contenance,
    created,
    updated,
    geometry,
    original_is_valid,
    original_validity_reason,
    ST_IsValid(geometry) AS is_valid_now,
    -- Computed while still in EPSG:2154, before the 4326 transform, so the unit is m².
    ST_Area(geometry) AS area_m2,
    ST_GeometryType(geometry) AS geometry_type
FROM fixed
