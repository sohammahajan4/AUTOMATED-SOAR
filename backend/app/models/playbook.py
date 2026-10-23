import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, JSON, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from ..database import Base


class PlaybookStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    waiting_approval = "waiting_approval"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"
    rolled_back = "rolled_back"


class Playbook(Base):
    __tablename__ = "playbooks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    definition = Column(JSON, nullable=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PlaybookExecution(Base):
    __tablename__ = "playbook_executions"

    id = Column(Integer, primary_key=True, index=True)
    playbook_id = Column(Integer, ForeignKey("playbooks.id"), nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    status = Column(Enum(PlaybookStatus), default=PlaybookStatus.pending, nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    logs = Column(JSON, default=list)
    approved = Column(Boolean, nullable=True)
    current_step = Column(Integer, default=0, nullable=False)

    playbook = relationship("Playbook", backref="executions")
    incident = relationship("Incident", backref="playbook_executions")
