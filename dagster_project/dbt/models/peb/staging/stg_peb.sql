{{ config(
    materialized='table',
    schema='workspace'
) }}

SELECT
    zone as acoustic_zone,
    indldenext as acoustic_db_value,
    indldenext,
    indldenint,
    code_oaci,
    nom as label,
    date_arret,
    producteur,
    date_maj,
    ref_doc as campaign_url,
    id_map,
    REGEXP_SUBSTR(date_arret, '\d{4}') AS campaign,
    geometry
FROM {{ source('public_workspace', 'raw_peb') }}
