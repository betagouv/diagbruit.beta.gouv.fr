{{ config(
    materialized='table',
    schema='workspace'
) }}

SELECT
    geometry,
    'tramway' AS source,
    'T' AS typesource,
    id AS codeinfra,
    larg_secte AS buffer,
    categorie as sound_category,
    to_jsonb(ROW(
        categorie,
        electrifie,
        etat,
        id,
        larg_secte,
        largeur,
        nature,
        nb_voies
    )) AS extra_fields
FROM {{ source('public_workspace', 'raw_soundclassification_tramway') }}

UNION ALL

SELECT
    geometry,
    'sncf' AS source,
    'F' AS typesource,
    ligne AS codeinfra,
    CAST(sect_affec AS bigint) AS buffer,
    CAST(rang AS int) as sound_category,
    to_jsonb(ROW(
        base_class,
        code_dept,
        communes,
        dept,
        evol_class,
        lidebssseg,
        lifinssseg,
        ligne,
        long_ssseg,
        nvx_class,
        pkdebssseg,
        pkfinssseg,
        publi_ap,
        rang,
        region,
        sect_affec,
        segment
    )) AS extra_fields
FROM {{ source('public_workspace', 'raw_soundclassification_sncf') }}

UNION ALL

SELECT
    geometry,
    'routier' AS source,
    'R' AS typesource,
    numero AS codeinfra,
    larg_secte AS buffer,
    cat_bruit as sound_category,
    to_jsonb(ROW(
        cat_bruit,
        cls_commen,
        cls_id,
        communes,
        debutant,
        finissant,
        gestion,
        horizon,
        larg_secte,
        nom_tronc,
        numero,
        projet
    )) AS extra_fields
FROM {{ source('public_workspace', 'raw_soundclassification_routier') }}

UNION ALL

SELECT
    geometry,
    'lgv' AS source,
    'F' AS typesource,
    toponyme AS codeinfra,
    larg_secte AS buffer,
    cat as sound_category,
    to_jsonb(ROW(
        cat,
        date_conf,
        date_creat,
        date_maj,
        electrifie,
        etat,
        id,
        id_vfn,
        larg_secte,
        largeur,
        nature,
        nb_voies,
        pos_sol,
        toponyme
    )) AS extra_fields
FROM {{ source('public_workspace', 'raw_soundclassification_lgv') }}
