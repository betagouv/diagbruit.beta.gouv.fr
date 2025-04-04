from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import diag
from .database import engine
from . import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FastAPI PostgreSQL API",
    description="A simple API with FastAPI and PostgreSQL",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diag.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI PostgreSQL API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}