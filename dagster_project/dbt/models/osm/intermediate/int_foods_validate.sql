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
    FROM {{ ref('int_foods_filter') }}
),
terrasses AS (
    SELECT
        name,
        codedept,
        geometry,
        regexp_replace(
            regexp_replace(
                lower(unaccent(name)),
                '(^|\s)(le|la|les|au)(\s|$)',
                '',
                'gi'
            ),
            '[^a-z0-9]', '', 'g'
        ) AS name_clean
    FROM {{ ref('int_terrasses_slug') }}
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
    FROM terrasses t
    WHERE t.codedept = o.meta_code_dep
    AND ST_DWithin(
            t.geometry::geography,
            o.geometry::geography,
            20
        )
    AND (
            o.name_clean LIKE '%' || t.name_clean || '%'
         OR t.name_clean LIKE '%' || o.name_clean || '%'
         OR similarity(o.name_clean, t.name_clean) > 0.40
        )
)
