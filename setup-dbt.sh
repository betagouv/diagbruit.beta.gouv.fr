#!/bin/bash
# setup-dbt.sh - Configures dbt environment for new developers

# Create dbt config directory if it doesn't exist
mkdir -p ~/.dbt

# Check if profiles.yml already exists
if [ ! -f ~/.dbt/profiles.yml ]; then
  cp dbt/profiles.yml.example ~/.dbt/profiles.yml
  echo "Created profiles.yml template. Please edit ~/.dbt/profiles.yml with your database credentials."
else
  echo "~/.dbt/profiles.yml already exists."
  echo "Would you like to update it with the project template? (y/n)"
  read answer
  if [ "$answer" == "y" ]; then
    # Backup existing profile
    cp ~/.dbt/profiles.yml ~/.dbt/profiles.yml.backup
    echo "Existing profile backed up to ~/.dbt/profiles.yml.backup"
    
    # Merge or replace with new profile
    cp dbt/profiles.yml.example ~/.dbt/profiles.yml
    echo "Updated profiles.yml with project template. Please update your credentials."
  else
    echo "Leaving existing profiles.yml unchanged."
  fi
fi

# Verify dbt can find the profile
echo "Testing dbt configuration..."
cd dbt && dbt debug --config-dir

echo "Setup complete. If there were any errors, please fix them before continuing."
