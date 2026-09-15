# Metabase

Déployé sur Scalingo (`diag-bruit-metabase`) via `git subtree push --prefix metabase`,
automatisé par [`.github/workflows/deploy-metabase.yml`](../.github/workflows/deploy-metabase.yml).

## Authentification

Metabase tourne derrière [`oauth2-proxy`](https://github.com/betagouv/oauth2-proxy-buildpack),
qui authentifie via ProConnect avant de relayer les requêtes.

Le buildpack lance deux processus : `oauth2-proxy` sur `$PORT` — le seul port
routé par Scalingo — et Metabase sur le port 8080 interne. L'URL
`*.osc-fr1.scalingo.io`, déductible du workflow de déploiement, passe donc elle
aussi par le proxy.

`bin/start` est inchangé : il traduit `$PORT` en `MB_JETTY_PORT`, et le buildpack
exporte `PORT=8080` pour le processus applicatif. `HEROKU=true` est conservé dans
le `Procfile` pour garder le calibrage mémoire de la JVM.

Configuration, démarches ProConnect et procédure de secours :
[`docs/auth-proconnect.md`](../docs/auth-proconnect.md).
