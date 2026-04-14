{{ config(
    materialized='table',
    post_hook=[
        "ALTER TABLE {{ this }} ADD COLUMN IF NOT EXISTS pk SERIAL PRIMARY KEY;",
        "DROP INDEX IF EXISTS idx_{{ this.name }}_geometry; CREATE INDEX idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);"
    ]
) }}

SELECT
    label,
    geometry,
    category_slug,
    meta_code_dep AS codedept
FROM {{ ref('noisesource_stras') }}

UNION ALL

SELECT
    name AS label,
    geometry,
    category_slug,
    meta_code_dep AS codedept
FROM {{ ref('int_foods_slug') }}

UNION ALL

SELECT
    name AS label,
    geometry,
    category_slug,
    codedept
FROM {{ ref('int_schools_slug') }}
