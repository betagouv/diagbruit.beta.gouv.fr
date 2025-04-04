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

### Create a Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on macOS/Linux
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment Variables

Create a `.env` file in the root directory:

```
cp .env.example .env
```

### Run the Application

```bash
uvicorn app.main:app --reload
```

The API will be available at http://127.0.0.1:8000

## API Documentation

FastAPI automatically generates interactive API documentation:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | / | Root endpoint with welcome message |
| GET | /health | Health check endpoint |

## Project Structure

```
fastapi-postgres-api/
│
├── app/
│   ├── __init__.py
│   ├── main.py             
│   ├── database.py         
│   ├── models/            
│   │   ├── __init__.py
│   │   └── noisemap.py     
│   ├── schemas/            
│   │   ├── __init__.py
│   │   └── noisemap.py     
│   └── routes/             
│       ├── __init__.py
│       └── noisemap.py     
│
├── .env                   
├── requirements.txt        
├── Dockerfile              
└── docker-compose.yml     
```

## Development

### Adding New Models

1. Define a new model in `app/models.py`
2. Create corresponding schemas in `app/schemas.py`
3. Add routes in `app/routes/` directory
4. Register new routers in `app/main.py`

### Database Migrations

This project does not include database migrations by default. To add migration support:

1. Install alembic: `pip install alembic`
2. Initialize alembic: `alembic init alembic`
3. Configure alembic to use your database connection

## Deployment

For production deployment:

1. Use a production ASGI server like Uvicorn or Hypercorn
2. Set up proper database credentials
3. Configure CORS for your specific origins
4. Consider adding authentication

Example deployment command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```