{{ config(
    materialized='incremental',
    incremental_strategy='delete+insert',
    unique_key='codedept',
    on_schema_change='sync_all_columns',
    post_hook=[
      "DROP INDEX IF EXISTS idx_{{ this.name }}_geometry; CREATE INDEX idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_codedept; CREATE INDEX idx_{{ this.name }}_codedept ON {{ this }} (codedept);",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_noisemap_id; CREATE INDEX idx_{{ this.name }}_noisemap_id ON {{ this }} (noisemap_id);"
    ]
) }}

-- Isophone contours carry tens of thousands of vertices, so the GIST index finds a
-- candidate in microseconds and then `ST_Intersects` spends ~1.3 ms proving it is a
-- false positive. Measured on dept 033: classifying 1 990 945 parcels as exposed or
-- not took 43 minutes, 99% of it inside that exact test.
--
-- Splitting each contour into pieces of at most 256 vertices trades more index hits
-- for far cheaper exact tests. The pieces tile the original without overlap, so a
-- consumer can sum intersection areas per `noisemap_id` and recover exactly the area
-- it would have got from the undivided polygon — which is what the sonoscore batch
-- needs for `percent_impacted`.
--
-- This is a companion to `noisemap`, not a replacement: the API still reads the
-- undivided table, one row per contour.
--
-- It deliberately lives in models/noisemap/ so that the `select="noisemap"` folder
-- selector in defs/dbt_noisemap rebuilds it in the same command as its parent.
-- `noisemap.id` comes from a sequence and is reassigned on every rebuild, so a
-- model built separately would end up pointing at ids that no longer exist. The
-- price is that a failure here also fails the step that builds `noisemap`.
--
-- The codedept guard is NOT gated on is_incremental(): on the very first build the
-- table does not exist yet, and gating it there would turn the next routine
-- single-department run into a national subdivide.

SELECT
  id AS noisemap_id,
  campaign,
  codedept,
  acoustic_producer_kind,
  label,
  kind,
  acoustic_noisemap_kind,
  acoustic_db_value,
  acoustic_time_range,
  ST_Subdivide(geometry, 256) AS geometry
FROM {{ ref('noisemap') }}
{% if var('codedept', none) is not none %}
WHERE codedept = '{{ var("codedept") }}'
{% endif %}
