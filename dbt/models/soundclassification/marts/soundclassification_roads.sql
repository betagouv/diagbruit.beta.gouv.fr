{{ config(
    materialized='table',
) }}

SELECT
    MIN(pk) AS pk,
    source,
    typesource,
    codeinfra,
    codedept,
    ST_Union(multilinestring) AS geometry
FROM {{ ref('int_soundclassification_merge') }}
WHERE area_m2 > 0
GROUP BY
    source,
    typesource,
    codeinfra,
    codedept