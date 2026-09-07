{{ config(
    materialized='view',
    schema='workspace'
) }}

-- Kept as a view (unlike the other domains' staging tables): the national cadastre
-- is ~100M rows, so materialising an intermediate copy of it would double the
-- storage for no gain — only the `parcelle` mart is read by the API and the batch.
SELECT
    id AS idu,
    commune AS code_insee,
    prefixe,
    -- The source pads section to 2 but leaves numero unpadded; the API and the
    -- `result` table both use the zero-padded form, so normalise here.
    LPAD(section, 2, '0') AS section,
    LPAD(numero, 4, '0') AS numero,
    codedept,
    release,
    contenance,
    created,
    updated,
    geometry

FROM {{ source('public_workspace', 'raw_cadastre_parcelles') }}
