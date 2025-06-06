{{ config(
    materialized='view',
    schema='workspace'
) }}

SELECT
    row_number() OVER () AS pk,
    multilinestring,
    source,
    typesource,
    codeinfra,
    buffer,
    sound_category,
    codedept,
    original_is_valid,
    original_validity_reason,
    is_valid_now,
    area_m2,
    geometry_type,
    geom_idx,
    geometry
FROM {{ ref('int_soundclassification_fixed_clean') }}
