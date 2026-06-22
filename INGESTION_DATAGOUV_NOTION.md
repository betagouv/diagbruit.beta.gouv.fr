# Ingestion data.gouv.fr → Notion

Instructions et restrictions pour l'ingestion de datasets depuis le MCP data.gouv.fr vers une base Notion.

## Outils requis

- **MCP data.gouv.fr** — configuré dans `.mcp.json` avec `"url": "https://mcp.data.gouv.fr/mcp"`
- **MCP Notion** — connecteur Notion disponible en session

## Recherche des datasets

- Utiliser `search_datasets` avec un terme précis (l'API est en logique AND — éviter les mots génériques)
- **Ignorer les datasets sans ressources** (`Resources: 0`)
- Récupérer suffisamment de résultats (`page_size` élevé) pour filtrer les entrées vides

## Séparation en 2 bases Notion

Les datasets sont répartis selon leur nature dans deux bases distinctes :

| Catégorie | Nature | Base Notion | data_source_id |
|-----------|--------|-------------|----------------|
| **Classement sonore** | Données géométriques : linéaires classés, emprises, périmètres, secteurs affectés, zones impactées | [Ouvrir](https://app.notion.com/p/7c38c8c876f34916b766f669d323deda) | `0f1e9954-4932-4db5-a550-04473a65dc4b` |
| **Données infra** | Rapports et cartographies : CBS, PPBE, PEB, Zones calmes | [Ouvrir](https://app.notion.com/p/a6ac25e4207749a4aac30ebc4ee96466) | `0a8bc359-b474-4c50-ae41-6e363f90e2cc` |

Vue d'ensemble : [Dataset Data.gouv](https://app.notion.com/p/387570891e2881c1b14bf8b381f23f50)

### Règle de catégorisation

- **"Classement sonore"** : titre contient "classement sonore", "emprise", "périmètre", "largeur secteur", "linéaire", "zone impactée", "secteur affecté"
- **"Données infra"** : titre contient "CBS", "PPBE", "PEB", "zones calmes", "carte de bruit", "plan de prévention"
- En cas de doute : données géométriques d'infrastructure → Classement sonore ; rapports/cartographies stratégiques → Données infra

## Schéma des bases Notion

Chaque dataset ingéré doit contenir les champs suivants :

| Champ | Type Notion | Source |
|-------|-------------|--------|
| `Nom` | TITLE | `title` du dataset |
| `Organisation` | RICH_TEXT | `organization` du dataset |
| `Nombre de ressources` | NUMBER | `resources` count |
| `URL` | URL | URL de la fiche data.gouv.fr |
| `ID dataset` | RICH_TEXT | `id` technique data.gouv.fr |
| `Année` | NUMBER | Voir règle ci-dessous |
| `Code départemental` | RICH_TEXT | Déduit du territoire couvert |
| `Catégorie` | SELECT | Base Classement sonore uniquement |

## Règle de remplissage du champ Année

1. **Priorité 1** — si l'année figure dans le titre du dataset, l'utiliser
2. **Priorité 2** — sinon, appeler `get_dataset_info` pour récupérer `last_updated` et en extraire l'année

## Règle du Code départemental

- Déduire le code INSEE du département à partir du nom du territoire mentionné dans le titre ou l'organisation
- Exemples : Tarn → `81`, Indre-et-Loire → `37`, Vienne (Grand Poitiers) → `86`

## Workflow type

```
search_datasets(query, page_size=10+)
  → filtrer les entrées avec Resources > 0
  → pour chaque dataset retenu (en parallèle) :
      - get_dataset_info(dataset_id)   # si année manquante dans le titre
      - déterminer la catégorie
      - déduire le code départemental
  → vérifier les doublons dans les deux bases (par ID dataset)
  → ingérer dans la base correspondante à la catégorie
```

## Restrictions

- Ne jamais ingérer un dataset avec 0 ressource
- Ne pas laisser le champ `Année` vide : utiliser la date de dernière mise à jour si le titre ne contient pas d'année
- Ne pas laisser le champ `Code départemental` vide si le territoire est identifiable
- Vérifier l'absence de doublon dans les deux bases avant ingestion
