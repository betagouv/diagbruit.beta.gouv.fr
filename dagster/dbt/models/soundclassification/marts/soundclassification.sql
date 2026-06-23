{{ config(
    materialized='table',
    post_hook=[
      "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);",
      "CREATE INDEX IF NOT EXISTS idx_{{ this.name }}_road_geometry ON {{ this }} USING GIST (road_geometry);"
    ]
) }}

SELECT
    id,
    source,
    kind,
    label,
    acoustic_buffer,
    acoustic_category,
    codedept,
    geometry,
    ST_Union(multilinestring) OVER (PARTITION BY source, kind, label, codedept) AS road_geometry
FROM {{ ref('int_soundclassification_merge') }}
WHERE area_m2 > 0
