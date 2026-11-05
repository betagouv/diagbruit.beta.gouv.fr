# Authentification ProConnect devant Metabase et Strapi

## Principe

Metabase et Strapi n'ont pas de SSO en édition libre. Le client OIDC n'est donc
pas l'application elle-même mais `oauth2-proxy`, lancé dans le même conteneur :

```
navigateur → oauth2-proxy ($PORT) → application (127.0.0.1:8080)
                   ↓ OIDC
              ProConnect
```

Sur Scalingo, seul `$PORT` est routé depuis l'extérieur. Le proxy l'occupant,
l'application n'est joignable que par lui — y compris via l'URL
`*.osc-fr1.scalingo.io`, déductible des workflows de déploiement de ce dépôt
public et qui contournerait un filtrage posé sur le seul domaine.

Les deux écrans de connexion se cumulent : ProConnect, puis le login applicatif.
Les rôles internes de Metabase et Strapi restent inchangés.

Les deux apps récupèrent le binaire par le même buildpack,
[`betagouv/oauth2-proxy-buildpack`](https://github.com/betagouv/oauth2-proxy-buildpack),
déclaré dans leur `.buildpacks`. Seul le lancement diffère :

| App | Lancement |
|---|---|
| Metabase | `metabase/Procfile` → script générique du buildpack, configuré par variables |
| Strapi | `cms/Procfile` → `cms/entrypoint.sh`, qui fixe les chemins publics dans le code |

> ⚠️ **Scalingo ignore `cms/Dockerfile`.** L'app est construite par les
> buildpacks ; le `Dockerfile` ne sert qu'en local. Sans `cms/Procfile`,
> Scalingo lance `yarn start` directement sur `$PORT` et le proxy n'existe pas —
> c'était le cas au premier déploiement de cette mise en place.

## Version minimale : v7.15.5

`oauth2-proxy` < 7.15.2 cumule quatre contournements d'authentification :

| CVE | Objet | Vulnérable |
|---|---|---|
| CVE-2026-41059 | bypass par confusion de fragment dans `skip_auth_routes` / `skip_auth_regex` | ≥ 7.5.0, < 7.15.2 |
| CVE-2026-40575 | bypass par usurpation de `X-Forwarded-Uri` | ≥ 7.5.0, < 7.15.2 |
| CVE-2026-40574 | bypass de validation de domaine via claim email multi-`@` | < 7.15.2 |
| CVE-2026-34457 | bypass via *User-Agent* de health check | < 7.15.2 |

La première touche le mécanisme même sur lequel repose l'ouverture des chemins
publics ci-dessous. `v7.15.5` en corrige quatre de plus : `CVE-2026-56855`,
`CVE-2026-78662`, `CVE-2026-84304`, `CVE-2026-84445`.

> ⚠️ **Ne pas définir `OAUTH2_PROXY_VERSION` sur les apps Metabase et CMS.** Le buildpack
> betagouv épingle désormais `v7.15.5` par défaut (il était en `v7.15.0` jusqu'au
> 29/09/2026), et apparie la version à un `OAUTH2_PROXY_CHECKSUM` vérifié au
> build. Poser la version sans le checksum correspondant fait échouer le
> `sha256sum -c` du buildpack, donc le déploiement. Laisser les deux par défaut.

Sur Scalingo, la version vient donc du buildpack pour les deux apps. L'`ARG`
de `cms/Dockerfile` ne vaut que pour une image construite en local.

## Chemins laissés ouverts

Sans ces exceptions, le site public tombe.

| App | Ouvert sans authentification | Pourquoi |
|---|---|---|
| Metabase | `^/embed/`, `^/api/embed/`, `^/app/` | iframe signée de la page `/stats` |
| Metabase | `^/api/session/properties$` | amorçage du bundle front |
| Strapi | `^/api/`, `^/uploads/` | contenu et médias du site public |
| Strapi | `^/images/` | images des e-mails sortants, servies depuis `cms/public/images/` |

Deux points à ne pas relâcher :

- **Ancrer les expressions avec `^`.** `oauth2-proxy` fait une recherche de
  sous-chaîne : `/public/` non ancré matche aussi `/admin/x/public/y`. Les
  exemples qui circulent (`/app/.*,/public/.*`) sont vulnérables à ça.
- **`/public/` et `/api/public/` ne sont pas ouverts.** C'est le préfixe des
  *public links* Metabase. La page `/stats` utilise l'embed **signé**
  (`/embed/`), pas les public links : les ouvrir rouvrirait l'accès anonyme aux
  tableaux de bord partagés.

Côté Strapi, ces exceptions vivent dans `cms/entrypoint.sh`, donc sous revue.
Côté Metabase, le buildpack étant générique, elles vivent dans
`OAUTH2_PROXY_SKIP_AUTH_ROUTES` — modifiables depuis le dashboard sans revue.
Toute modification doit être reportée ici.

## Variables d'environnement

### Metabase (`diag-bruit-metabase`)

```sh
OAUTH2_PROXY_PROVIDER=oidc
OAUTH2_PROXY_OIDC_ISSUER_URL=https://fca.integ01.dev-agentconnect.fr/api/v2
OAUTH2_PROXY_CLIENT_ID=...
OAUTH2_PROXY_CLIENT_SECRET=...
OAUTH2_PROXY_COOKIE_SECRET=...
OAUTH2_PROXY_REDIRECT_URL=https://metabase.diagbruit.beta.gouv.fr/oauth2/callback
OAUTH2_PROXY_UPSTREAMS=http://127.0.0.1:8080
OAUTH2_PROXY_SCOPE=openid email
OAUTH2_PROXY_OIDC_EMAIL_CLAIM=email
OAUTH2_PROXY_PROMPT=login
OAUTH2_PROXY_COOKIE_SECURE=true
OAUTH2_PROXY_REVERSE_PROXY=true
OAUTH2_PROXY_SKIP_AUTH_ROUTES=^/embed/,^/api/embed/,^/app/,^/api/session/properties$
OAUTH2_ALLOWED_EMAILS=prenom.nom@example.fr,...
```

### Strapi (`diag-bruit-cms-prod`, `diag-bruit-cms-preprod`)

Mêmes variables, sans `OAUTH2_PROXY_VERSION`, `OAUTH2_PROXY_UPSTREAMS` ni
`OAUTH2_PROXY_SKIP_AUTH_ROUTES` — fixées dans l'image.

> ⚠️ **Ne pas définir `OAUTH2_PROXY_EMAIL_DOMAINS`.** La validation fait un **OU**
> entre le domaine et la liste d'adresses : `EMAIL_DOMAINS=*` annulerait
> l'allowlist et laisserait entrer toute identité ProConnect valide.

`OAUTH2_ALLOWED_EMAILS` est lue au démarrage. Ouvrir ou retirer un accès =
éditer la variable ; Scalingo redémarre l'app et la liste est active en une
trentaine de secondes. Aucune adresse n'est versionnée.

## Démarches ProConnect

1. Créer l'application sur <https://partenaires.proconnect.gouv.fr/apps>,
   environnement d'**intégration** d'abord.
2. Déclarer quatre `redirect_uris` — Metabase et Strapi × prod et preprod.
3. Récupérer `issuer`, `client_id`, `client_secret`.

### Scopes

Valeurs vérifiées sur le document de découverte d'intégration.

**`profile` n'existe pas chez ProConnect** — le demander fait échouer
l'autorisation en `invalid_scope`. Les exemples qui circulent l'incluent à tort.

**Les claims personnalisés** (`given_name`, `usual_name`) ne sont exploitables
qu'en [mode de configuration « alpha »](https://oauth2-proxy.github.io/oauth2-proxy/configuration/alpha-config)
d'`oauth2-proxy`, parce que `/userinfo` renvoie un **JWT signé** et non du JSON
(héritage FranceConnect). Nous n'en avons pas besoin : seule l'adresse sert, à
comparer à l'allowlist. D'où `openid email`, et rien de plus.

### Autres particularités du dossier

- `token_endpoint_auth_methods_supported` : `client_secret_post` et
  `private_key_jwt` uniquement, pas de `client_secret_basic`. Si l'échange de
  jeton échoue, chercher là.
- `end_session_endpoint` :
  `https://fca.integ01.dev-agentconnect.fr/api/v2/session/end`, à utiliser pour
  câbler la déconnexion IdP le moment venu.
- `response_types_supported` : `code` seulement.

**Pas de déconnexion IdP native.** Se déconnecter du proxy ne déconnecte pas de
ProConnect. Le contournement documenté par betagouv consiste à injecter un lien
vers `session/end` dans `OAUTH2_PROXY_FOOTER` — voir
[oauth2-deploy-demo](https://github.com/betagouv/oauth2-deploy-demo).

## Recette avant bascule en production

0. Le proxy tourne bien : le log de build mentionne le buildpack
   `oauth2-proxy`, et `https://<domaine>/oauth2/sign_in` répond (un 404 signifie
   que l'application est exposée directement, sans proxy).
1. `/stats` du frontend s'affiche en navigation privée, sans authentification.
2. Une page de contenu Strapi s'affiche, images comprises.
3. Un e-mail de diagnostic est reçu **avec ses images** (elles viennent de
   `/images/`, hors du proxy — voir le tableau des chemins ouverts).
4. `https://<domaine>/` redirige vers ProConnect.
5. `https://<app>.osc-fr1.scalingo.io/` redirige aussi vers ProConnect.
6. Une adresse absente d'`OAUTH2_ALLOWED_EMAILS` obtient un 403 après
   authentification.
7. `https://metabase.diagbruit.beta.gouv.fr/public/` n'est pas accessible
   anonymement.

## Procédure de secours

Une configuration OIDC cassée ferme la porte à tout le monde, administrateurs
compris.

Metabase : rétablir le `Procfile` d'origine (`web: HEROKU=true ./bin/start`) et
redéployer.

Strapi :

```bash
scalingo --app diag-bruit-cms-prod env-set DANGER_DISABLE_AUTH_PROXY=true
```

Dans les deux cas l'application repasse en écoute publique directe, derrière son
seul login applicatif. À retirer dès la configuration réparée.

## À remonter en amont

*Réglé.* Le buildpack `betagouv/oauth2-proxy-buildpack` épinglait `v7.15.0`,
vulnérable aux quatre CVE ci-dessus. Il est passé en `v7.15.4` le 29/09/2026,
puis en `v7.15.5` le 12/10/2026. Plus rien à signaler ; il suffit de ne pas
surcharger `OAUTH2_PROXY_VERSION`.
