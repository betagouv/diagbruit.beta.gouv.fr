from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Pool sizing: each diagnostic runs its 5 source queries concurrently, one session
# each (see routes/diag.py), and the diagnostic executor is capped at max_workers=4
# → up to 4 × 5 = 20 concurrent query sessions, plus the fire-and-forget
# upsert_diagnostic_result sessions. Size the pool to cover that.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_size=20,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()