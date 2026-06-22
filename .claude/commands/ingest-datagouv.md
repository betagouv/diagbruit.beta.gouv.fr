Recherche sur data.gouv.fr les datasets correspondant à : $ARGUMENTS

Suis ces règles (définies dans INGESTION_DATAGOUV_NOTION.md) :

1. Utilise le MCP data.gouv.fr (`search_datasets`) avec `page_size` suffisamment grand (≥ 10).
2. Filtre et ignore tout dataset avec `Resources: 0`.
3. Pour chaque dataset retenu, en parallèle :
   - Si l'année figure dans le titre → utilise-la.
   - Sinon → appelle `get_dataset_info(dataset_id)` et extrais l'année de `last_updated`.
   - Déduis le code départemental INSEE depuis le territoire mentionné dans le titre ou l'organisation.
   - Détermine la catégorie selon la règle ci-dessous.

## Règle Catégorie

- **"Classement sonore"** : titre contient "classement sonore", "emprise", "périmètre", "largeur secteur", "linéaire", "zone impactée", "secteur affecté"
- **"Données infra"** : titre contient "CBS", "PPBE", "PEB", "zones calmes", "carte de bruit", "plan de prévention"
- En cas de doute : préférer "Classement sonore" pour des données géométriques d'infrastructure, "Données infra" pour des rapports ou cartographies stratégiques.

## Séparation en 2 bases Notion

Ingère chaque dataset dans la base correspondant à sa catégorie :

**→ Classement sonore** (data_source_id: `0f1e9954-4932-4db5-a550-04473a65dc4b`) :
Champs : Nom, Organisation, Nombre de ressources, Tags, URL, ID dataset, Année, Code départemental, Catégorie.

**→ Données infra** (data_source_id: `0a8bc359-b474-4c50-ae41-6e363f90e2cc`) :
Champs : Nom, Organisation, Nombre de ressources, Tags, URL, ID dataset, Année, Code départemental.

## Restrictions

- Ne jamais ingérer un dataset avec 0 ressource.
- Ne jamais laisser les champs Année ou Code départemental vides si l'information est déductible.
- Vérifier l'absence de doublon (par ID dataset) dans les deux bases avant ingestion.
