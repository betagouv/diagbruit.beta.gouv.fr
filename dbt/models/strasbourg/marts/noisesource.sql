{{ config(
    materialized='table',
    post_hook="ALTER TABLE {{ this }} ADD COLUMN id serial4 PRIMARY KEY;"
) }}

SELECT
    label,
    geometry,
    category_slug
FROM {{ ref('int_stras_slug') }}
