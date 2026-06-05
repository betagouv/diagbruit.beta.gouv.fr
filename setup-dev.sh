# setup-dev.sh
#!/bin/bash
echo "Setting up ingestion environment..."
python -m venv ingestion-venv
source ingestion-venv/bin/activate
pip install -r ingestion/requirements.txt
deactivate

echo "Setting up FastAPI environment..."
python -m venv fastapi-venv
source fastapi-venv/bin/activate
pip install -r fastapi/requirements.txt
deactivate

echo "Setting up Dagster environment..."
python -m venv dagster-venv
source dagster-venv/bin/activate
cd dagster_project
uv sync
deactivate

echo "All environments set up! Activate the one you need with:"
echo "source [ingestion|dbt|fastapi|dagster]-venv/bin/activate"
