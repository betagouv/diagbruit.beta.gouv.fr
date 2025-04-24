{{ config(
    materialized='view',
    schema='workspace'
) }}

WITH fixed_geometries AS (
    SELECT
        multilinestring,
        source,
        typesource,
        codeinfra,
        buffer,
        sound_category,
        codedept,
        extra_fields,
        {{ repair_geometry('polygon_geom', 'is_valid', 'structure') }} AS geometry,
        is_valid AS original_is_valid,
        validity_reason AS original_validity_reason
    FROM {{ ref('int_soundclassification_validated') }}
)

SELECT
    multilinestring,
    source,
    typesource,
    codeinfra,
    buffer,
    sound_category,
    codedept,
    extra_fields,
    geometry,
    original_is_valid,
    original_validity_reason,
    ST_IsValid(geometry) AS is_valid_now,
    ST_Area(geometry) AS area_m2,
    ST_GeometryType(geometry) AS geometry_type
FROM fixed_geometries
