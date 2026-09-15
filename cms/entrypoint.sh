#!/usr/bin/env bash
set -euo pipefail

PUBLIC_PORT="${PORT:?PORT non défini}"

if [ "${DANGER_DISABLE_AUTH_PROXY:-false}" = "true" ]; then
  echo "WARNING: proxy d'authentification désactivé — Strapi est exposé publiquement" >&2
  exec yarn start
fi

tr ',' '\n' <<<"${ALLOWED_EMAILS:?ALLOWED_EMAILS non défini}" \
  | tr -d ' ' | grep . >/tmp/allowed-emails.txt

# Loopback : le proxy est le seul chemin d'entrée, y compris via l'URL *.scalingo.io.
HOST=127.0.0.1 PORT=1337 yarn start &
strapi_pid=$!

oauth2-proxy \
  --http-address="0.0.0.0:${PUBLIC_PORT}" \
  --upstream="http://127.0.0.1:1337" \
  --provider=oidc \
  --scope="openid email" \
  --oidc-email-claim=email \
  --authenticated-emails-file=/tmp/allowed-emails.txt \
  --skip-auth-regex='^/(api|uploads)/' \
  --reverse-proxy=true \
  --cookie-secure=true \
  --cookie-expire=8h \
  --cookie-refresh=1h &
proxy_pid=$!

# Sans ça, Strapi peut mourir sans que Scalingo ne redémarre le conteneur.
wait -n "$strapi_pid" "$proxy_pid"
