# DiagBruit - FastAPI

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

### FastApi

#### Create a Virtual Environment

```bash
# Create virtual environment
python -m venv fastapi-venv

# Activate on Windows
fastapi-venv\Scripts\activate

# Activate on macOS/Linux
source fastapi-venv/bin/activate
```

#### From fastapi folder

```bash
cd fastapi
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the root directory:

```
cp .env.example .env
```

#### Run the Application

```bash
uvicorn app.main:app --reload
```

The API will be available at http://127.0.0.1:8000

#### API Documentation

FastAPI automatically generates interactive API documentation:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

#### API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | / | Root endpoint with welcome message |
| GET | /health | Health check endpoint |

## Project Structure

```
diagbruit/
│
├── fastapi/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── mocks/
│   │   │   └── coordinates.json
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── noisemap.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   └── diag.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── noisemap.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── cadastre.py
│   │       ├── db.py
│   │       └── geometry.py
│   │
│   ├── .env.example
│   ├── requirements.txt
│
└── docker-entrypoint-initdb.d
│   ├── 01-init.sql
└── docker-compose.yml
```