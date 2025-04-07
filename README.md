# DiagBruit

## Prerequisites

- Python 3.8+
- GEOS library for spatial data processing:

  ```bash
  # On Ubuntu/Debian
  sudo apt-get install libgeos-dev

  # On macOS
  brew install geos

  # On CentOS/RHEL
  sudo yum install geos-devel
  ```

## Getting Started

### Start the PostgreSQL Database with PostGIS

The project uses PostgreSQL with PostGIS extension for spatial data. Launch it using Docker Compose:

```bash
docker-compose up -d
```

This will start a PostgreSQL database with the PostGIS extension on port 5433.

### Quick Setup

For a quick setup of all virtual environments:

```bash
./setup-dev.sh
```

This will create and configure all virtual environments for the different components of the project. You can then activate the environment you need to work with.

### Data ingestion

#### Launch dedicated Virtual Environment

```bash
source ingestion-venv/bin/activate
```

#### Launch seed raw data

```bash
cd ingestion
python ingest_shapefiles.py inputs/noise/N_BRUIT_ZBRD_INFRA_R_C_LN_S_044/N_BRUIT_ZBRD_INFRA_R_C_LN_S_044.shp raw_noisemap
```

### DBT

#### Launch dedicated Virtual Environment

```bash
source dbt-venv/bin/activate
```

#### Configure dbt Profile

```bash
./setup-dbt.sh
```

Then edit `~/.dbt/profiles.yml` with your database credentials.

#### Verify Configuration

```bash
cd dbt
dbt debug
```

#### Run Models

```bash
cd dbt
dbt run
```

### FastApi

#### Launch dedicated Virtual Environment

```bash
source fastapi-venv/bin/activate
```

#### Configure Environment Variables

```bash
cd fastapi
cp .env.example .env
```

#### Run the Application

```bash
cd fastapi
uvicorn app.main:app --reload
```

The API will be available at http://127.0.0.1:8000

#### API Documentation

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Project Structure

```
diagbruit/
│
├── fastapi/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   └── utils/
│   │
│   ├── .env.example
│   ├── requirements.txt
│
├── dbt/
│   ├── models/
│   ├── macros/
│   ├── tests/
│   ├── dbt_project.yml
│   ├── profiles.yml.example
│   └── requirements.txt
│
├── ingestion/
│   ├── inputs/
│   ├── .env.example
│   ├── ingest_shapefiles.py
│   └── requirements.txt
│
├── setup-dbt.sh
└── docker-compose.yml
```
