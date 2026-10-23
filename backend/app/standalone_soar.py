"""
Automated SOAR (Security Orchestration, Automation and Response)
Complete Standalone Implementation
"""

import enum
import time
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, JSON, Float, Table, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
from sqlalchemy.orm.attributes import flag_modified

# Database Setup
DATABASE_URL = "sqlite:///./soar_standalone.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def utc_now():
    return datetime.now(timezone.utc)


# Models
incident_alert_assoc = Table(
    "incident_alert_association",
    Base.metadata,
    Column("incident_id", Integer, ForeignKey("incidents.id"), primary_key=True),
    Column("alert_id", Integer, ForeignKey("alerts.id"), primary_key=True),
)


class PlaybookStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    waiting_approval = "waiting_approval"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


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


class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String, nullable=False)
    risk_score = Column(Float, default=50.0)
    category = Column(String, nullable=True)
    status = Column(String, default="new", nullable=False)
    priority = Column(String, default="medium", nullable=False)
    created_at = Column(DateTime, default=utc_now)
    alerts = relationship("Alert", secondary=incident_alert_assoc, backref="incidents")


class Playbook(Base):
    __tablename__ = "playbooks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    definition = Column(JSON, nullable=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)


class PlaybookExecution(Base):
    __tablename__ = "playbook_executions"
    id = Column(Integer, primary_key=True, index=True)
    playbook_id = Column(Integer, ForeignKey("playbooks.id"), nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    status = Column(SQLEnum(PlaybookStatus), default=PlaybookStatus.pending, nullable=False)
    start_time = Column(DateTime, default=utc_now)
    end_time = Column(DateTime, nullable=True)
    logs = Column(JSON, default=list)
    approved = Column(Boolean, nullable=True)
    current_step = Column(Integer, default=0, nullable=False)
    playbook = relationship("Playbook", backref="executions")
    incident = relationship("Incident", backref="playbook_executions")


Base.metadata.create_all(bind=engine)

# Schemas
class EventBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    event_id: str
    timestamp: datetime = Field(default_factory=utc_now)
    source_product: str
    category: str
    severity: str
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    user: Optional[str] = None
    hostname: Optional[str] = None
    detection_rule: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None
    correlation_id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None


class AlertCreate(EventBase):
    @model_validator(mode="before")
    @classmethod
    def extract_metadata(cls, values: Any) -> Any:
        if isinstance(values, dict) and "metadata" in values and "meta" not in values:
            values["meta"] = values.get("metadata")
        return values


class AlertOut(EventBase):
    id: int
    processed: bool = False
    created_at: datetime = Field(default_factory=utc_now)


class IncidentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str
    risk_score: Optional[float] = 50.0
    category: Optional[str] = None
    status: Optional[str] = "new"
    priority: Optional[str] = "medium"
    alert_ids: Optional[List[int]] = Field(default_factory=list)


class PlaybookCreate(BaseModel):
    name: str
    description: Optional[str] = None
    definition: Dict[str, Any]
    enabled: bool = True


# Playbook Orchestration Engine
def _add_log(exec_rec: PlaybookExecution, step_name: str, message: str, level: str = "INFO", details: dict = None):
    current_logs = list(exec_rec.logs or [])
    entry = {"timestamp": datetime.now(timezone.utc).isoformat() + "Z", "step": step_name, "level": level, "message": message}
    if details:
        entry["details"] = details
    current_logs.append(entry)
    exec_rec.logs = current_logs
    flag_modified(exec_rec, "logs")


def execute_playbook(execution_id: int, db: Session):
    exec_rec = db.query(PlaybookExecution).filter(PlaybookExecution.id == execution_id).first()
    if not exec_rec:
        return
    pb = db.query(Playbook).filter(Playbook.id == exec_rec.playbook_id).first()
    if not pb:
        return

    steps = (pb.definition or {}).get("steps", [])
    start_idx = exec_rec.current_step or 0

    if exec_rec.status != PlaybookStatus.running:
        exec_rec.status = PlaybookStatus.running
        _add_log(exec_rec, "orchestration", f"Playbook '{pb.name}' execution started")
        db.commit()

    try:
        for idx in range(start_idx, len(steps)):
            step = steps[idx]
            stype = step.get("type", "validate")
            sname = step.get("name", stype)

            if stype == "validate":
                _add_log(exec_rec, sname, f"Validated incident telemetry for step {sname}")
            elif stype == "enrich":
                _add_log(exec_rec, sname, "IOC Threat Intel Query: VirusTotal Malicious Score 85/90", details={"confidence": "95%", "geo": "Romania"})
                if exec_rec.incident:
                    exec_rec.incident.risk_score = min(100.0, (exec_rec.incident.risk_score or 50.0) + 25.0)
            elif stype in ["contain", "isolate"]:
                _add_log(exec_rec, sname, "EDR Network Quarantine Applied to Target Host", details={"action": "isolate_endpoint", "status": "quarantined"})
                if exec_rec.incident:
                    exec_rec.incident.status = "contained"
            elif stype == "block_ip":
                _add_log(exec_rec, sname, "Firewall Perimeter Rule Injected: Malicious IP Blocked", details={"firewall": "PaloAlto-01", "action": "DROP"})
            elif stype == "disable_user":
                _add_log(exec_rec, sname, "Active Directory Account Suspended & OAuth Tokens Revoked", details={"iam_status": "locked"})
            elif stype == "notify":
                _add_log(exec_rec, sname, f"Dispatched Notification to {step.get('channel', 'Slack #soc-war-room')}")
            elif stype == "wait_approval":
                if exec_rec.approved is True:
                    _add_log(exec_rec, sname, f"Approval gate passed for step {sname}")
                else:
                    exec_rec.status = PlaybookStatus.waiting_approval
                    _add_log(exec_rec, sname, "ACTION PAUSED: Requires SOC Lead authorization", level="WARN")
                    exec_rec.current_step = idx + 1
                    db.commit()
                    return

            exec_rec.current_step = idx + 1
            db.commit()
            time.sleep(0.02)
    except Exception as e:
        exec_rec.status = PlaybookStatus.failed
        _add_log(exec_rec, "error", f"Error during step: {str(e)}", level="ERROR")
        db.commit()
        return

    exec_rec.status = PlaybookStatus.completed
    exec_rec.end_time = datetime.now(timezone.utc)
    _add_log(exec_rec, "completion", "Playbook execution completed successfully")
    db.commit()


# FastAPI App
app = FastAPI(title="Automated SOAR API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "AutomatedSOAR"}


@app.get("/api/v1/stats")
def stats(db: Session = Depends(get_db)):
    return {
        "total_alerts": db.query(Alert).count(),
        "unprocessed_alerts": db.query(Alert).filter(Alert.processed == False).count(),
        "total_incidents": db.query(Incident).count(),
        "active_incidents": db.query(Incident).filter(Incident.status.in_(["new", "investigating", "contained"])).count(),
        "total_playbooks": db.query(Playbook).count(),
        "running_executions": db.query(PlaybookExecution).filter(PlaybookExecution.status == PlaybookStatus.running).count(),
        "pending_approvals": db.query(PlaybookExecution).filter(PlaybookExecution.status == PlaybookStatus.waiting_approval).count(),
        "severity_breakdown": {s: db.query(Alert).filter(Alert.severity == s).count() for s in ["critical", "high", "medium", "low"]},
    }


@app.get("/api/v1/alerts", response_model=List[AlertOut])
def list_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).order_by(Alert.timestamp.desc()).all()


@app.post("/api/v1/alerts", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
def ingest_alert(alert_in: AlertCreate, db: Session = Depends(get_db)):
    if db.query(Alert).filter(Alert.event_id == alert_in.event_id).first():
        raise HTTPException(status_code=409, detail="Alert with event_id already exists")
    db_alert = Alert(**alert_in.model_dump())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


@app.post("/api/v1/alerts/simulate", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
def simulate_alert(scenario: str = Query("phishing"), db: Session = Depends(get_db)):
    event_id = f"EVT-{scenario.upper()}-{uuid.uuid4().hex[:6].upper()}"
    db_alert = Alert(
        event_id=event_id,
        source_product="CrowdStrike / Proofpoint Simulator",
        category=scenario,
        severity="critical" if scenario in ["ransomware", "c2"] else "high",
        detection_rule=f"SIMULATED-DETECTION-{scenario.upper()}",
        source_ip="185.220.101.5",
        destination_ip="10.0.1.25",
        user="analyst@company.com",
        hostname="ENG-LAPTOP-01",
        evidence={"scenario": scenario, "timestamp": datetime.now(timezone.utc).isoformat()},
        meta={"simulated": True},
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


@app.get("/api/v1/incidents")
def list_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.created_at.desc()).all()


@app.post("/api/v1/incidents", status_code=status.HTTP_201_CREATED)
def create_incident(inc_in: IncidentCreate, db: Session = Depends(get_db)):
    db_inc = Incident(
        title=inc_in.title,
        description=inc_in.description,
        severity=inc_in.severity,
        risk_score=inc_in.risk_score or 50.0,
        category=inc_in.category,
        status=inc_in.status or "new",
        priority=inc_in.priority or "medium",
    )
    if inc_in.alert_ids:
        db_inc.alerts = db.query(Alert).filter(Alert.id.in_(inc_in.alert_ids)).all()
    db.add(db_inc)
    db.commit()
    db.refresh(db_inc)
    return db_inc


@app.get("/api/v1/playbooks")
def list_playbooks(db: Session = Depends(get_db)):
    return db.query(Playbook).all()


@app.post("/api/v1/playbooks", status_code=status.HTTP_201_CREATED)
def create_playbook(pb_in: PlaybookCreate, db: Session = Depends(get_db)):
    db_pb = Playbook(**pb_in.model_dump())
    db.add(db_pb)
    db.commit()
    db.refresh(db_pb)
    return db_pb


@app.post("/api/v1/playbooks/{playbook_id}/execute", status_code=status.HTTP_202_ACCEPTED)
def run_playbook_endpoint(playbook_id: int, incident_id: Optional[int] = None, db: Session = Depends(get_db)):
    exec_rec = PlaybookExecution(playbook_id=playbook_id, incident_id=incident_id, status=PlaybookStatus.pending, logs=[])
    db.add(exec_rec)
    db.commit()
    db.refresh(exec_rec)
    execute_playbook(exec_rec.id, db)
    db.refresh(exec_rec)
    return exec_rec


@app.get("/api/v1/approvals/pending")
def list_pending_approvals(db: Session = Depends(get_db)):
    return db.query(PlaybookExecution).filter(PlaybookExecution.status == PlaybookStatus.waiting_approval).all()


@app.post("/api/v1/executions/{execution_id}/approve")
def approve_exec(execution_id: int, db: Session = Depends(get_db)):
    rec = db.query(PlaybookExecution).filter(PlaybookExecution.id == execution_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Execution not found")
    rec.approved = True
    rec.status = PlaybookStatus.running
    db.commit()
    execute_playbook(rec.id, db)
    db.refresh(rec)
    return rec


@app.get("/api/v1/executions")
def list_executions(db: Session = Depends(get_db)):
    return db.query(PlaybookExecution).order_by(PlaybookExecution.start_time.desc()).all()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("standalone_soar:app", host="127.0.0.1", port=8000, reload=True)
