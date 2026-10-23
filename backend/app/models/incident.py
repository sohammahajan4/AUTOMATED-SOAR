import enum
from datetime import datetime
from sqlalchemy import Table, Column, Integer, ForeignKey, String, Float, DateTime, Enum, Text
from sqlalchemy.orm import relationship
from ..database import Base

# Association table for many-to-many relationship between incidents and alerts
incident_alert_association = Table(
    "incident_alert_association",
    Base.metadata,
    Column("incident_id", Integer, ForeignKey("incidents.id"), primary_key=True),
    Column("alert_id", Integer, ForeignKey("alerts.id"), primary_key=True),
)


class IncidentStatus(str, enum.Enum):
    new = "new"
    investigating = "investigating"
    contained = "contained"
    resolved = "resolved"
    closed = "closed"


class IncidentPriority(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String, nullable=False)  # critical, high, medium, low
    risk_score = Column(Float, default=0.0)
    category = Column(String, nullable=True)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.new, nullable=False)
    priority = Column(Enum(IncidentPriority), default=IncidentPriority.medium, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    alerts = relationship(
        "Alert",
        secondary=incident_alert_association,
        backref="incidents",
    )
