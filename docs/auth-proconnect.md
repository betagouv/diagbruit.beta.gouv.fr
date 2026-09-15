# Authentification ProConnect devant Metabase et Strapi

## Principe

Metabase et Strapi n'ont pas de SSO en édition libre. Le client OIDC n'est donc
pas l'application elle-même mais `oauth2-proxy`, embarqué dans le même conteneur :

```
navigateur → oauth2-proxy (0.0.0.0:$PORT) → application (127.0.0.1)
                   ↓ OIDC
              ProConnect
```

L'application n'écoute que sur la boucle locale. Le proxy est donc le seul chemin
d'entrée, y compris via l'URL `*.osc-fr1.scalingo.io` — laquelle est déductible
des workflows de déploiement de ce dépôt public et contournerait un filtrage
posé sur le seul domaine public.

Les deux écrans de connexion se cumulent : ProConnect d'abord, puis le login
applicatif. Les rôles et permissions internes de Metabase et Strapi restent
inchangés.

## Chemins laissés ouverts

Ces exceptions sont indispensables : sans elles, le site public tombe.

| Application | Ouvert sans authentification | Pourquoi |
|---|---|---|
| Metabase | `/embed/`, `/api/embed/`, `/app/` | iframe signée de la page `/stats` |
| Metabase | `/api/session/properties` | amorçage du bundle front |
| Strapi | `/api/`, `/uploads/` | contenu et médias du site public |

`/public/` n'est **pas** ouvert : c'est le préfixe des *public links* Metabase,
qui seraient autrement lisibles par n'importe qui.

## Variables d'environnement

À poser sur `diag-bruit-metabase`, `diag-bruit-cms-prod` et `diag-bruit-cms-preprod`.

| Variable | Valeur |
|---|---|
| `OAUTH2_PROXY_OIDC_ISSUER_URL` | fourni par le dossier d'habilitation ProConnect |
| `OAUTH2_PROXY_CLIENT_ID` | idem |
| `OAUTH2_PROXY_CLIENT_SECRET` | idem |
| `OAUTH2_PROXY_REDIRECT_URL` | `https://<domaine>/oauth2/callback` |
| `OAUTH2_PROXY_COOKIE_SECRET` | `openssl rand -base64 32 \| head -c 32` |
| `ALLOWED_EMAILS` | adresses autorisées, séparées par des virgules |

Sur `diag-bruit-metabase`, supprimer aussi `BUILDPACK_URL` : tant qu'elle est
présente, Scalingo reste en build buildpack et ignore le `Dockerfile`.

`ALLOWED_EMAILS` est lue au démarrage et écrite dans un fichier temporaire.
Ouvrir ou retirer un accès = éditer la variable ; Scalingo redémarre l'app et la
liste est active en une trentaine de secondes. Aucune adresse n'est versionnée.

## Démarches ProConnect

1. Demander l'habilitation sur le portail partenaires, environnement
   d'**intégration** d'abord.
2. Déclarer quatre `redirect_uris` — Metabase et Strapi, prod et preprod.
3. Récupérer `issuer`, `client_id`, `client_secret` dans le dossier. Les URLs ont
   changé au passage d'AgentConnect à ProConnect : ne pas reprendre celles d'un
   tutoriel ancien.
4. Vérifier ce que le dossier impose sur `acr_values` et
   `token_endpoint_auth_method`, et ajuster l'`entrypoint.sh` si besoin.

### Point de friction connu

ProConnect hérite de l'architecture FranceConnect : `/userinfo` renvoie un **JWT
signé**, pas du JSON, ce qu'`oauth2-proxy` ne sait pas lire.

Le contournement retenu est `--oidc-email-claim=email`, qui lit l'adresse dans
l'`id_token` sans appeler `/userinfo`. À valider sur l'environnement
d'intégration : si l'`id_token` ne porte pas `email` avec le scope demandé, il
faudra élargir les scopes.

## Recette avant bascule en production

1. `/stats` du frontend s'affiche en navigation privée, sans authentification.
2. Une page de contenu tirée de Strapi s'affiche, images comprises.
3. `https://<domaine>/` redirige vers ProConnect.
4. `https://<app>.osc-fr1.scalingo.io/` redirige aussi vers ProConnect.
5. Une adresse absente d'`ALLOWED_EMAILS` obtient un 403 après authentification.

## Procédure de secours

Une configuration OIDC cassée ferme la porte à tout le monde, administrateurs
compris. Dans ce cas seulement :

```bash
scalingo --app <app> env-set DANGER_DISABLE_AUTH_PROXY=true
```

L'application repasse en écoute publique directe, derrière son seul login
applicatif. À retirer dès la configuration réparée.
