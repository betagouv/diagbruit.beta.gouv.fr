#!/usr/bin/env bash
# Pousse un sous-dossier du monorepo sur la branche `main` d'une app Scalingo et
# échoue si le build ou le démarrage de l'application échoue.
#
# Scalingo accepte le push (la ref `main` distante est mise à jour) puis build et
# démarre l'app en renvoyant ses logs dans la sortie du push. Un échec de build
# n'apparaît que dans ces logs : `git push` sort quand même avec le code 0. On
# analyse donc la sortie pour connaître le vrai résultat du déploiement.
#
# Variables d'environnement :
#   SCALINGO_APP    nom de l'app Scalingo (ex. diag-bruit-cms-preprod)
#   SUBTREE_PREFIX  sous-dossier à déployer (ex. cms)
#   SCALINGO_GIT_URL  (optionnel) URL git cible, déduite de SCALINGO_APP par défaut
set -euo pipefail

: "${SCALINGO_APP:?SCALINGO_APP manquant}"
: "${SUBTREE_PREFIX:?SUBTREE_PREFIX manquant}"
remote="${SCALINGO_GIT_URL:-git@ssh.osc-fr1.scalingo.com:${SCALINGO_APP}.git}"

log="$(mktemp)"
trap 'rm -f "$log"' EXIT

if ! git subtree push --prefix "$SUBTREE_PREFIX" "$remote" main 2>&1 | tee "$log"; then
  echo "::error::Le push git vers ${SCALINGO_APP} a échoué."
  exit 1
fi

if grep -q "Everything up-to-date" "$log"; then
  echo "::notice::${SCALINGO_APP} est déjà à jour, aucun déploiement déclenché."
  exit 0
fi

if grep -q "Error deploying the application" "$log"; then
  echo "::error::Le déploiement Scalingo de ${SCALINGO_APP} a échoué (voir les logs de build ci-dessus)."
  exit 1
fi

# En cas de succès, Scalingo termine par « <-- https://<app>.osc-fr1.scalingo.io --> ».
# Sans ce marqueur, on ne peut pas affirmer que le déploiement a réussi.
if ! grep -q "<-- https://" "$log"; then
  echo "::error::Résultat du déploiement Scalingo de ${SCALINGO_APP} inconnu : marqueur de succès absent de la sortie du push."
  exit 1
fi

echo "Déploiement de ${SCALINGO_APP} réussi."
