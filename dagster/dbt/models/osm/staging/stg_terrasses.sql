{{ config(
    schema='workspace',
) }}


SELECT
    nom_enseigne AS name,
    adresse_etablissement AS address,
    codedept,
    geometry

FROM {{ source('public_workspace', 'raw_full_osm_terrasses') }}
