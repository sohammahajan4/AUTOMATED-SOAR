import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .. import schemas, database
from ..models import Alert, Incident, Playbook, PlaybookExecution, PlaybookStatus
from ..dependencies import get_current_user

router = APIRouter()


@router.post(
    "/alerts",
    response_model=schemas.Alert,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_user)],
)
def ingest_alert(alert_in: schemas.AlertCreate, db: Session = Depends(database.get_db)):
    """Ingest a security alert, validate, deduplicate, and store it."""
    existing = db.query(Alert).filter(Alert.event_id == alert_in.event_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Alert with event_id '{alert_in.event_id}' already exists.",
        )

    db_alert = Alert(
        event_id=alert_in.event_id,
        timestamp=alert_in.timestamp or datetime.now(timezone.utc),
        source_product=alert_in.source_product,
        category=alert_in.category,
        severity=alert_in.severity.value if hasattr(alert_in.severity, "value") else str(alert_in.severity),
        source_ip=alert_in.source_ip,
        destination_ip=alert_in.destination_ip,
        user=alert_in.user,
        hostname=alert_in.hostname,
        detection_rule=alert_in.detection_rule,
        evidence=alert_in.evidence,
        correlation_id=alert_in.correlation_id,
        meta=alert_in.meta,
        processed=False,
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


@router.get(
    "/alerts",
    response_model=List[schemas.Alert],
    dependencies=[Depends(get_current_user)],
)
def list_alerts(
    skip: int = 0,
    limit: int = 100,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    processed: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db),
):
    """Return a paginated and filtered list of stored alerts."""
    query = db.query(Alert)
    if severity:
        query = query.filter(Alert.severity == severity.lower())
    if category:
        query = query.filter(Alert.category.ilike(f"%{category}%"))
    if processed is not None:
        query = query.filter(Alert.processed == processed)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Alert.event_id.ilike(term),
                Alert.source_product.ilike(term),
                Alert.detection_rule.ilike(term),
                Alert.source_ip.ilike(term),
                Alert.user.ilike(term),
                Alert.hostname.ilike(term),
            )
        )
    return query.order_by(Alert.timestamp.desc()).offset(skip).limit(limit).all()


@router.get(
    "/alerts/{alert_id}",
    response_model=schemas.Alert,
    dependencies=[Depends(get_current_user)],
)
def get_alert(alert_id: int, db: Session = Depends(database.get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return alert


@router.delete(
    "/alerts/{alert_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_current_user)],
)
def delete_alert(alert_id: int, db: Session = Depends(database.get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return None


@router.post(
    "/alerts/simulate",
    response_model=schemas.Alert,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_user)],
)
def simulate_alert(
    scenario: str = Query("phishing", description="Scenario: phishing, ransomware, brute_force, impossible_travel, c2"),
    db: Session = Depends(database.get_db),
):
    """Generate and ingest a synthetic enterprise security alert for testing."""
    scenarios = {
        "phishing": {
            "source_product": "Proofpoint Email Gateway",
            "category": "phishing",
            "severity": "high",
            "source_ip": "185.220.101.5",
            "destination_ip": "10.0.4.12",
            "user": "finance-lead@company.com",
            "hostname": "FIN-LAPTOP-04",
            "detection_rule": "SEC-RULE-904: Urgent Invoice Credential Harvesting Domain",
            "evidence": {
                "subject": "OVERDUE WIRE TRANSFER #INV-9902",
                "sender": "billing-support@secure-intuit-update.cc",
                "embedded_url": "https://secure-intuit-update.cc/login?token=89f3b",
                "attachments": ["Invoice_March.iso"],
            },
        },
        "ransomware": {
            "source_product": "CrowdStrike Falcon EDR",
            "category": "malware",
            "severity": "critical",
            "source_ip": "192.168.1.105",
            "destination_ip": "45.133.1.20",
            "user": "soham.dev",
            "hostname": "ENG-WORKSTATION-01",
            "detection_rule": "EDR-BEHAVIOR: Shadow Copy Deletion & Mass File Encryption Pattern",
            "evidence": {
                "process_tree": "powershell.exe -> vssadmin.exe delete shadows /all /quiet",
                "file_hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "ransom_note": "README_DECRYPT.txt",
            },
        },
        "brute_force": {
            "source_product": "Active Directory Domain Controller",
            "category": "authentication",
            "severity": "medium",
            "source_ip": "194.26.29.112",
            "destination_ip": "10.0.0.1",
            "user": "administrator",
            "hostname": "DC-PRIMARY-01",
            "detection_rule": "AD-AUDIT-4625: 450 Failed Kerberos Logons within 60 Seconds",
            "evidence": {
                "failed_attempts": 450,
                "target_domain": "CORP.LOCAL",
                "sub_status": "0xC000006A (Bad Password)",
            },
        },
        "impossible_travel": {
            "source_product": "Okta Identity Cloud",
            "category": "identity",
            "severity": "high",
            "source_ip": "91.240.118.23",
            "destination_ip": "10.0.1.50",
            "user": "ciso@company.com",
            "hostname": "OKTA-AUTH-GATEWAY",
            "detection_rule": "IAM-GEO-ANOMALY: Concurrent Sign-Ins New York (US) & St. Petersburg (RU)",
            "evidence": {
                "location_1": "New York, USA (10:14 UTC)",
                "location_2": "St. Petersburg, Russia (10:22 UTC)",
                "distance_km": 7000,
                "velocity_kmh": 52500,
            },
        },
        "c2": {
            "source_product": "Suricata Network IDS",
            "category": "c2_network",
            "severity": "critical",
            "source_ip": "10.0.2.88",
            "destination_ip": "185.193.61.155",
            "user": "svc-backup",
            "hostname": "SRV-FILE-STORAGE",
            "detection_rule": "ET MALWARE CobaltStrike Beaconing Heartbeat Observed over HTTPS",
            "evidence": {
                "ja3_fingerprint": "a0e9f5d64349fb13191bc781f81f42e1",
                "jitter_percent": "10%",
                "beacon_interval": "60s",
                "payload_size": 248,
            },
        },
    }

    selected = scenarios.get(scenario.lower(), scenarios["phishing"])
    event_id = f"EVT-{scenario.upper()}-{uuid.uuid4().hex[:8].upper()}"

    db_alert = Alert(
        event_id=event_id,
        timestamp=datetime.now(timezone.utc),
        source_product=selected["source_product"],
        category=selected["category"],
        severity=selected["severity"],
        source_ip=selected["source_ip"],
        destination_ip=selected["destination_ip"],
        user=selected["user"],
        hostname=selected["hostname"],
        detection_rule=selected["detection_rule"],
        evidence=selected["evidence"],
        correlation_id=f"CORR-{uuid.uuid4().hex[:6].upper()}",
        meta={"simulated": True, "scenario": scenario},
        processed=False,
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


@router.get(
    "/stats",
    response_model=schemas.SOCStats,
    dependencies=[Depends(get_current_user)],
)
def get_soc_stats(db: Session = Depends(database.get_db)):
    """Fetch high-level SOC metrics for dashboard display."""
    total_alerts = db.query(Alert).count()
    unprocessed_alerts = db.query(Alert).filter(Alert.processed == False).count()
    total_incidents = db.query(Incident).count()
    active_incidents = db.query(Incident).filter(Incident.status.in_(["new", "investigating", "contained"])).count()
    total_playbooks = db.query(Playbook).count()
    running_executions = db.query(PlaybookExecution).filter(PlaybookExecution.status == PlaybookStatus.running).count()
    pending_approvals = db.query(PlaybookExecution).filter(PlaybookExecution.status == PlaybookStatus.waiting_approval).count()

    severities = ["critical", "high", "medium", "low"]
    breakdown = {}
    for s in severities:
        breakdown[s] = db.query(Alert).filter(Alert.severity == s).count()

    return schemas.SOCStats(
        total_alerts=total_alerts,
        unprocessed_alerts=unprocessed_alerts,
        total_incidents=total_incidents,
        active_incidents=active_incidents,
        total_playbooks=total_playbooks,
        running_executions=running_executions,
        pending_approvals=pending_approvals,
        severity_breakdown=breakdown,
    )
