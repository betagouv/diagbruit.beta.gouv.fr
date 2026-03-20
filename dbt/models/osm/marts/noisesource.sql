{{ config(
    materialized='table',
    post_hook=[
        "ALTER TABLE {{ this }} ADD COLUMN id serial4 PRIMARY KEY;",
        "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);"
    ]
) }}

SELECT
    label,
    geometry,
    meta_code_dep AS codeDept,
    category_slug
FROM {{ ref('noisesource_stras') }}

UNION ALL

SELECT
    name AS label,
    geometry,
    meta_code_dep AS codeDept,
    category_slug
FROM {{ ref('int_osm_slug') }}
