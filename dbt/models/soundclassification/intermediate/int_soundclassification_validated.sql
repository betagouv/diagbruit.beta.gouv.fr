{{ config(
    materialized='view',
    schema='workspace'
) }}

SELECT
    *,
    {{ validate_geometry('polygon_geom') }}
FROM {{ ref('int_soundclassification_buffered') }}