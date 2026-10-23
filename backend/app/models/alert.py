from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from ..database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, unique=True, nullable=False, index=True)
    timestamp = Column(DateTime, default=utc_now, nullable=False)
    source_product = Column(String, nullable=False)
    category = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    source_ip = Column(String, nullable=True)
    destination_ip = Column(String, nullable=True)
    user = Column(String, nullable=True)
    hostname = Column(String, nullable=True)
    detection_rule = Column(String, nullable=True)
    evidence = Column(JSON, nullable=True)
    correlation_id = Column(String, nullable=True)
    meta = Column("metadata", JSON, nullable=True)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
