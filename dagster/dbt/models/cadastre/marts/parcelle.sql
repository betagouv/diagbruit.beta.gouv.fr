{{ config(
    materialized='table',
    post_hook=[
      "DROP INDEX IF EXISTS idx_{{ this.name }}_geometry; CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_idu; CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_idu ON {{ this }} (idu);",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_code_insee; CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_code_insee ON {{ this }} (code_insee);",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_codedept; CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_codedept ON {{ this }} (codedept);",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_parcelle_ref; CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_parcelle_ref ON {{ this }} (code_insee, section, numero);"
    ]
) }}

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
    {{ transform_to_epsg_4326('geometry') }} AS geometry,
    area_m2,
    4326 AS srid,
    original_is_valid,
    original_validity_reason,
    is_valid_now,
    geometry_type
FROM {{ ref('int_parcelle_fixed') }}
WHERE COALESCE(area_m2, 0) > 0.0
