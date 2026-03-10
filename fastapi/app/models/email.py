from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..database import Base


class DiagnosticEmail(Base):
    """Model for storing email subscriptions with user profile"""
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, nullable=False)
    profile = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
