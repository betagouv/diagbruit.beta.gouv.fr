#!/usr/bin/env bash
set -euo pipefail

PUBLIC_PORT="${PORT:?PORT non défini}"

if [ "${DANGER_DISABLE_AUTH_PROXY:-false}" = "true" ]; then
  echo "WARNING: proxy d'authentification désactivé — Strapi est exposé publiquement" >&2
  exec yarn start
fi

: "${OAUTH2_PROXY_CLIENT_ID:?OAUTH2_PROXY_CLIENT_ID non défini}"
: "${OAUTH2_PROXY_CLIENT_SECRET:?OAUTH2_PROXY_CLIENT_SECRET non défini}"
: "${OAUTH2_PROXY_COOKIE_SECRET:?OAUTH2_PROXY_COOKIE_SECRET non défini}"

echo "${OAUTH2_ALLOWED_EMAILS:?OAUTH2_ALLOWED_EMAILS non défini}" \
  | tr ',' '\n' | tr -d ' ' | grep . >/tmp/allowed_emails.txt

HOST=127.0.0.1 PORT=8080 yarn start &
strapi_pid=$!

# Les exceptions d'authentification restent ici plutôt qu'en variable
# d'environnement : elles sont critiques et doivent passer par une revue.
oauth2-proxy \
  --http-address="0.0.0.0:${PUBLIC_PORT}" \
  --upstream="http://127.0.0.1:8080" \
  --provider=oidc \
  --authenticated-emails-file=/tmp/allowed_emails.txt \
  --skip-auth-regex='^/api/' \
  --skip-auth-regex='^/uploads/' \
  --reverse-proxy=true \
  --cookie-secure=true \
  --cookie-expire=8h \
  --cookie-refresh=1h &
proxy_pid=$!

# Sans ça, Strapi peut mourir sans que Scalingo ne redémarre le conteneur.
wait -n "$strapi_pid" "$proxy_pid"
