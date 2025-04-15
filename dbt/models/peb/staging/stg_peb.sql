{{ config(
    materialized='table',
    schema='workspace'
) }}

SELECT
    zone,
    indldenext as legende,
    indldenext,
    indldenint,
    code_oaci,
    nom,
    date_arret,
    producteur,
    date_maj,
    ref_doc,
    id_map,
    geometry
FROM {{ source('public_workspace', 'raw_peb') }}
