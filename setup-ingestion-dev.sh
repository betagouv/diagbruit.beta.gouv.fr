source ./dagster-venv/bin/activate
cd ./dagster
uv sync
uv run dg launch --job dev_pipeline_by_codedept_job --partition 033