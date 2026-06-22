Pipeline complète data.gouv.fr → Notion pour : $ARGUMENTS

## Séparation en 2 bases distinctes

Les datasets sont répartis en deux bases Notion selon leur nature :

| Catégorie | Nature des données | Base Notion | data_source_id |
|-----------|-------------------|-------------|----------------|
| **Classement sonore** | Données géométriques d'infrastructure : linéaires classés, emprises, périmètres, secteurs affectés, largeurs de secteur, zones impactées | [Ouvrir](https://app.notion.com/p/7c38c8c876f34916b766f669d323deda) | `0f1e9954-4932-4db5-a550-04473a65dc4b` |
| **Données infra** | Rapports et cartographies stratégiques : Cartes de Bruit Stratégiques (CBS), Plans de Prévention du Bruit (PPBE), Plans d'Exposition au Bruit (PEB), Zones calmes | [Ouvrir](https://app.notion.com/p/a6ac25e4207749a4aac30ebc4ee96466) | `0a8bc359-b474-4c50-ae41-6e363f90e2cc` |

Vue d'ensemble des deux bases : [Dataset Data.gouv](https://app.notion.com/p/387570891e28816cbf5fe8bb6093d5cb)

Suis ces étapes dans l'ordre :

## Étape 1 — Recherche
Utilise `search_datasets` avec `page_size: 20` pour la requête : $ARGUMENTS
Filtre et ignore tout dataset avec `Resources: 0`.
Affiche un résumé : "X datasets trouvés, Y écartés (0 ressources)."

## Étape 2 — Enrichissement
Pour chaque dataset retenu, en parallèle :
- Si l'année figure dans le titre → utilise-la.
- Sinon → appelle `get_dataset_info(dataset_id)` et extrais l'année de `last_updated`.
- Déduis le code départemental INSEE depuis le territoire (titre ou organisation).
- Détermine la catégorie selon la règle ci-dessous.

### Règle Catégorie
- **"Classement sonore"** : titre contient "classement sonore", "emprise", "périmètre", "largeur secteur", "linéaire", "zone impactée", "secteur affecté"
- **"Données infra"** : titre contient "CBS", "PPBE", "PEB", "zones calmes", "carte de bruit", "plan de prévention"
- En cas de doute : préférer "Classement sonore" pour des données géométriques d'infrastructure, "Données infra" pour des rapports ou cartographies stratégiques.

## Étape 3 — Déduplication
Avant ingestion, vérifie que l'ID dataset n'existe pas déjà dans les deux bases Notion.
Ignore les doublons silencieusement.

## Étape 4 — Ingestion
Ingère chaque nouveau dataset dans la base correspondant à sa catégorie :

**→ Classement sonore** (data_source_id: `0f1e9954-4932-4db5-a550-04473a65dc4b`) :
Champs : Nom, Organisation, Nombre de ressources, URL, ID dataset, Année, Code départemental, Catégorie.

**→ Données infra** (data_source_id: `0a8bc359-b474-4c50-ae41-6e363f90e2cc`) :
Champs : Nom, Organisation, Nombre de ressources, URL, ID dataset, Année, Code départemental.

## Étape 5 — Résumé
Affiche un bilan final :
- N datasets ingérés (X Classement sonore, Y Données infra)
- N doublons ignorés
- Départements couverts
- Liens vers les deux bases Notion
