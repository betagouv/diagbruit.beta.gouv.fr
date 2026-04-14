{{ config(
    materialized='table',
) }}

SELECT
    label,
    name,
    geometry,
    '067' as meta_code_dep,
    category_slug
FROM {{ ref('int_stras_slug') }}
