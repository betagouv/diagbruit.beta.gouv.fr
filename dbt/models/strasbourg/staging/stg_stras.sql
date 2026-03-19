{{ config(
    schema='workspace',
) }}


SELECT 
    nom_enseigne as name,
    adresse_etablissement as address,
    geometry
    
FROM {{ source('public_workspace', 'raw_full_stras_data') }}