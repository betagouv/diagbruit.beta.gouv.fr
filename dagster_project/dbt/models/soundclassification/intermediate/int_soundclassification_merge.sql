{{ config(
    materialized='view',
    schema='workspace'
) }}

SELECT
    MIN(pk) AS pk,
    source,
    typesource,
    codeinfra,
    buffer,
    sound_category,
    codedept,
    array_agg(pk ORDER BY pk) AS merged_pks,
    ST_Union(geometry) AS geometry,
    ST_Union(multilinestring) AS multilinestring,
    ST_IsValid(ST_Union(geometry)) AS is_valid_now,
    ST_Area(ST_Union(geometry)) AS area_m2,
    ST_GeometryType(ST_Union(geometry)) AS geometry_type
FROM {{ ref('int_soundclassification_with_pk') }}
GROUP BY
    source,
    typesource,
    codeinfra,
    sound_category,
    codedept,
    buffer
