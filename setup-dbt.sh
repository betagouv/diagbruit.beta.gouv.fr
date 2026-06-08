#!/bin/bash
# setup-dbt.sh - Creates the local dbt profile for the Dagster dbt project.
#
# The dbt project now lives in dagster/dbt and is loaded by Dagster's
# DbtProjectComponent, which reads its profile from the project directory
# (dagster/dbt/), NOT from ~/.dbt. So the profile must live there.

set -e

EXAMPLE="dagster/dbt/profiles.yml.example"
PROFILE="dagster/dbt/profiles.yml"

if [ -f "$PROFILE" ]; then
  echo "$PROFILE already exists — leaving it unchanged."
else
  cp "$EXAMPLE" "$PROFILE"
  echo "Created $PROFILE from the example."
  echo "Edit it if your database credentials differ from the docker-compose defaults (localhost:5433, user/password)."
fi
