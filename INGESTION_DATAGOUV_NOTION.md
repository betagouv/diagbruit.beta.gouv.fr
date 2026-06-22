# Ingestion data.gouv.fr → Notion

Instructions et restrictions pour l'ingestion de datasets depuis le MCP data.gouv.fr vers une base Notion.

## Outils requis

- **MCP data.gouv.fr** — configuré dans `.mcp.json` avec `"url": "https://mcp.data.gouv.fr/mcp"`
- **MCP Notion** — connecteur Notion disponible en session

## Recherche des datasets

- Utiliser `search_datasets` avec un terme précis (l'API est en logique AND — éviter les mots génériques)
- **Ignorer les datasets sans ressources** (`Resources: 0`)
- Récupérer suffisamment de résultats (`page_size` élevé) pour filtrer les entrées vides

## Schéma de la base Notion

Chaque dataset ingéré doit contenir les champs suivants :

| Champ | Type Notion | Source |
|-------|-------------|--------|
| `Nom` | TITLE | `title` du dataset |
| `Organisation` | RICH_TEXT | `organization` du dataset |
| `Nombre de ressources` | NUMBER | `resources` count |
| `Tags` | MULTI_SELECT | `tags` du dataset |
| `URL` | URL | URL de la fiche data.gouv.fr |
| `ID dataset` | RICH_TEXT | `id` technique data.gouv.fr |
| `Année` | NUMBER | Voir règle ci-dessous |
| `Code départemental` | RICH_TEXT | Déduit du territoire couvert |

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
  → pour chaque dataset retenu :
      get_dataset_info(dataset_id)   # si année manquante dans le titre
  → notion-create-database(schema)
  → notion-create-pages(3 entrées)
```

## Restrictions

- Ne jamais ingérer un dataset avec 0 ressource
- Ne pas laisser le champ `Année` vide : utiliser la date de dernière mise à jour si le titre ne contient pas d'année
- Ne pas laisser le champ `Code départemental` vide si le territoire est identifiable
