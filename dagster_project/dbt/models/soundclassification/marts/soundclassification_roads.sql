{{ config(
    materialized='table',
    post_hook=[
      "ALTER TABLE {{ this }} ADD COLUMN IF NOT EXISTS pk SERIAL PRIMARY KEY;",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_geometry; CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_label; CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_label ON {{ this }} (label);"
    ]
) }}

SELECT
    MIN(pk) AS pk,
    source,
    kind,
    label,
    codedept,
    ST_Union(multilinestring) AS geometry
FROM {{ ref('int_soundclassification_merge') }}
WHERE area_m2 > 0
GROUP BY
    source,
    kind,
    label,
    codedept