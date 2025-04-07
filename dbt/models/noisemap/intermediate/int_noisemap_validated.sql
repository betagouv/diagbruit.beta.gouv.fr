{{ config(
    materialized='view',
    schema='workspace'
) }}

SELECT
    *,
    {{ validate_geometry('geometry') }}
FROM {{ ref('int_noisemap_exploded') }}