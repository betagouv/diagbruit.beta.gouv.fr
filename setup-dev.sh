# setup-dev.sh
#!/bin/bash
echo "Setting up ingestion environment..."
python -m venv ingestion-venv
source ingestion-venv/bin/activate
pip install -r ingestion/requirements.txt
deactivate

echo "Setting up dbt environment..."
python -m venv dbt-venv
source dbt-venv/bin/activate
pip install -r dbt/requirements.txt
./setup-dbt.sh
deactivate

echo "Setting up FastAPI environment..."
python -m venv fastapi-venv
source fastapi-venv/bin/activate
pip install -r fastapi/requirements.txt
deactivate

echo "All environments set up! Activate the one you need with:"
echo "source [ingestion|dbt|fastapi]-venv/bin/activate"
