#!/usr/bin/env bash
set -euo pipefail

PUBLIC_PORT="${PORT:?PORT non défini}"

if [ "${DANGER_DISABLE_AUTH_PROXY:-false}" = "true" ]; then
  echo "WARNING: proxy d'authentification désactivé — Metabase est exposé publiquement" >&2
  export MB_JETTY_HOST=0.0.0.0
  export MB_JETTY_PORT="$PUBLIC_PORT"
  exec /app/run_metabase.sh
fi

tr ',' '\n' <<<"${ALLOWED_EMAILS:?ALLOWED_EMAILS non défini}" \
  | tr -d ' ' | grep . >/tmp/allowed-emails.txt

# Loopback : le proxy est le seul chemin d'entrée, y compris via l'URL *.scalingo.io.
export MB_JETTY_HOST=127.0.0.1
export MB_JETTY_PORT=3000
/app/run_metabase.sh &
metabase_pid=$!

oauth2-proxy \
  --http-address="0.0.0.0:${PUBLIC_PORT}" \
  --upstream="http://127.0.0.1:3000" \
  --provider=oidc \
  --scope="openid email" \
  --oidc-email-claim=email \
  --authenticated-emails-file=/tmp/allowed-emails.txt \
  --skip-auth-regex='^/(embed|api/embed|app)/' \
  --skip-auth-regex='^/api/session/properties$' \
  --reverse-proxy=true \
  --cookie-secure=true \
  --cookie-expire=8h \
  --cookie-refresh=1h &
proxy_pid=$!

# Sans ça, Metabase peut mourir sans que Scalingo ne redémarre le conteneur.
wait -n "$metabase_pid" "$proxy_pid"
