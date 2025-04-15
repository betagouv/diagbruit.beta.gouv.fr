{{ config(
    materialized='view',
    schema='workspace'
) }}

SELECT
    *,
    {{ validate_geometry('geometry') }}
FROM {{ ref('stg_peb') }}