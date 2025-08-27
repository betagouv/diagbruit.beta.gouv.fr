from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import diag, metabase
from .database import engine
from . import models
from .version import get_api_version

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="diagBruit FastAPI",
    description="An simple api to get diagBruit diagnostics. Powered by diagBruit 🚀",
    version=get_api_version(),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diag.router)
app.include_router(metabase.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI PostgreSQL API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}