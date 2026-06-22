SELECT codedept
FROM {{ source('public_workspace', 'raw_noisemap') }}
WHERE codedept IS NULL
   OR codedept !~ '^[0-9]{3}$'
