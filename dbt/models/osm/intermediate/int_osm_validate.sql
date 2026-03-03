{{ config(
    schema='workspace',
) }}

WITH osm_filtered AS (
    SELECT
        name,
        type,
        meta_code_dep,
        geometry,
        regexp_replace(
            regexp_replace(
                lower(unaccent(name)),
                '(^|\s)(le|la|les)(\s|$)',
                '',
                'gi'
            ),
            '[^a-z0-9]', '', 'g'
        ) AS name_clean
    FROM {{ ref('int_osm_filter') }}
),
stras AS (
    SELECT
        name,
        regexp_replace(
            regexp_replace(
                lower(unaccent(name)),
                '(^|\s)(le|la|les)(\s|$)',
                '',
                'gi'
            ),
            '[^a-z0-9]', '', 'g'
        ) AS name_clean
    FROM {{ ref('stg_stras') }}
)

SELECT
    o.name,
    o.type,
    o.meta_code_dep,
    o.geometry,
    o.name_clean

FROM osm_filtered o
WHERE o.name IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM stras s
    WHERE o.meta_code_dep = '67' AND similarity(o.name_clean, s.name_clean) > 0.40 
)