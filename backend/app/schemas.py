import enum
from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict


def utc_now():
    return datetime.now(timezone.utc)


class Severity(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class EventBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: str = Field(..., description="Unique identifier for the security event")
    timestamp: datetime = Field(default_factory=utc_now)
    source_product: str = Field(..., description="Name of the product generating the event")
    category: str = Field(..., description="Event category, e.g., phishing, endpoint, auth")
    severity: Severity
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    user: Optional[str] = None
    hostname: Optional[str] = None
    detection_rule: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None
    correlation_id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None

    @field_validator("event_id")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("event_id must not be empty")
        return v


class AlertCreate(EventBase):
    @model_validator(mode="before")
    @classmethod
    def extract_metadata(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "metadata" in values and "meta" not in values:
                values["meta"] = values.get("metadata")
        return values


class Alert(EventBase):
    id: int
    processed: bool = False
    created_at: datetime = Field(default_factory=utc_now)


# Playbook schemas
class PlaybookBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., description="Unique name of the playbook")
    description: Optional[str] = Field(None, description="Human-readable description")
    definition: Dict[str, Any] = Field(..., description="JSON definition of steps, conditions, actions")
    enabled: bool = Field(True, description="Whether the playbook can be executed")


class PlaybookCreate(PlaybookBase):
    pass


class PlaybookUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    definition: Optional[Dict[str, Any]] = None
    enabled: Optional[bool] = None


class Playbook(PlaybookBase):
    id: int
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class PlaybookExecutionBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    playbook_id: int
    incident_id: Optional[int] = None
    status: Optional[str] = Field("pending", description="Current execution state")
    approved: Optional[bool] = None
    current_step: Optional[int] = 0
    logs: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Step-by-step log entries")


class PlaybookExecutionCreate(PlaybookExecutionBase):
    pass


class PlaybookExecution(PlaybookExecutionBase):
    id: int
    start_time: datetime = Field(default_factory=utc_now)
    end_time: Optional[datetime] = None
    playbook_name: Optional[str] = None


class IncidentBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str = Field(..., description="Short descriptive title of the incident")
    description: Optional[str] = Field(None, description="Detailed narrative of the incident")
    severity: Severity = Field(..., description="Overall severity level of the incident")
    risk_score: Optional[float] = Field(0.0, description="Calculated risk score (0-100)")
    category: Optional[str] = Field(None, description="Incident category, e.g., phishing, malware")
    status: Optional[str] = Field("new", description="Current incident status")
    priority: Optional[str] = Field("medium", description="Incident priority")


class IncidentCreate(IncidentBase):
    alert_ids: Optional[List[int]] = Field(default_factory=list, description="List of related alert IDs")


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[Severity] = None
    risk_score: Optional[float] = None
    category: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    alert_ids: Optional[List[int]] = None


class Incident(IncidentBase):
    id: int
    alerts: List[Alert] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class SOCStats(BaseModel):
    total_alerts: int
    unprocessed_alerts: int
    total_incidents: int
    active_incidents: int
    total_playbooks: int
    running_executions: int
    pending_approvals: int
    severity_breakdown: Dict[str, int]
