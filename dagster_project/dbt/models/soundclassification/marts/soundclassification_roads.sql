{{ config(
    materialized='table',
    post_hook=[
      "ALTER TABLE {{ this }} ADD COLUMN IF NOT EXISTS pk SERIAL PRIMARY KEY;",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_geometry; CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_codeinfra; CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_codeinfra ON {{ this }} (codeinfra);"
    ]
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