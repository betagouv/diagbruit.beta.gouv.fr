# Metabase

Déployé sur Scalingo (`diag-bruit-metabase`) via `git subtree push --prefix metabase`,
automatisé par [`.github/workflows/deploy-metabase.yml`](../.github/workflows/deploy-metabase.yml).

## Build

Image Docker (`Dockerfile`), plus de buildpack. Scalingo détecte le `Dockerfile`
à la racine du répertoire déployé.

Le conteneur fait tourner deux processus :

- Metabase, en écoute sur `127.0.0.1:3000` uniquement ;
- `oauth2-proxy` sur `$PORT`, qui authentifie via ProConnect avant de relayer.

La liaison sur la boucle locale est ce qui ferme l'accès direct par l'URL
`*.osc-fr1.scalingo.io`, laquelle contourne le domaine public.

## Configuration

Voir [`docs/auth-proconnect.md`](../docs/auth-proconnect.md) pour les variables
d'environnement, les démarches ProConnect et la procédure de secours.

## Épingler la version

`METABASE_VERSION` vaut `latest` par défaut, ce qui n'est pas reproductible.
Relever la version réellement déployée (Admin → Troubleshooting → Version) et
l'écrire en dur dans le `Dockerfile` :

```dockerfile
ARG METABASE_VERSION=v0.XX.Y
```
