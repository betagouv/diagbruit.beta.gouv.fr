{{ config(
    materialized='incremental',
    incremental_strategy='delete+insert',
    unique_key='codedept',
    on_schema_change='sync_all_columns',
    pre_hook=[
      "CREATE SEQUENCE IF NOT EXISTS {{ this.schema }}.{{ this.name }}_id_seq"
    ],
    post_hook=[
      "DROP INDEX IF EXISTS idx_{{ this.name }}_geometry; CREATE INDEX idx_{{ this.name }}_geometry ON {{ this }} USING GIST (geometry);",
      "DROP INDEX IF EXISTS idx_{{ this.name }}_codedept; CREATE INDEX idx_{{ this.name }}_codedept ON {{ this }} (codedept);"
    ]
) }}

{{ subdivide_noisemap_features(ref('int_noisemap_projected')) }}
