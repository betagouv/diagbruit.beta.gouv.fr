{{ config(
    materialized='table',
) }}

SELECT
    label,
    name,
    geometry,
    category_slug
FROM {{ ref('int_stras_slug') }}
