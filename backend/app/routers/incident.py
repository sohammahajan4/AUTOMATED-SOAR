from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .. import schemas, database
from ..models import Incident, Alert, Playbook, PlaybookExecution, PlaybookStatus
from ..dependencies import get_current_user
from ..playbook_engine import execute_playbook

router = APIRouter()


@router.post(
    "/incidents",
    response_model=schemas.Incident,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_user)],
)
def create_incident(incident_in: schemas.IncidentCreate, db: Session = Depends(database.get_db)):
    db_incident = Incident(
        title=incident_in.title,
        description=incident_in.description,
        severity=incident_in.severity.value if hasattr(incident_in.severity, "value") else str(incident_in.severity),
        risk_score=incident_in.risk_score or 50.0,
        category=incident_in.category,
        status=incident_in.status or "new",
        priority=incident_in.priority or "medium",
    )
    if incident_in.alert_ids:
        alerts = db.query(Alert).filter(Alert.id.in_(incident_in.alert_ids)).all()
        db_incident.alerts = alerts
        # Mark linked alerts as processed
        for a in alerts:
            a.processed = True

    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    return db_incident


@router.get(
    "/incidents",
    response_model=List[schemas.Incident],
    dependencies=[Depends(get_current_user)],
)
def list_incidents(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db),
):
    query = db.query(Incident)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if severity:
        query = query.filter(Incident.severity == severity.lower())
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Incident.title.ilike(term),
                Incident.description.ilike(term),
                Incident.category.ilike(term),
            )
        )
    return query.order_by(Incident.created_at.desc()).offset(skip).limit(limit).all()


@router.get(
    "/incidents/{incident_id}",
    response_model=schemas.Incident,
    dependencies=[Depends(get_current_user)],
)
def get_incident(incident_id: int, db: Session = Depends(database.get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    return inc


@router.put(
    "/incidents/{incident_id}",
    response_model=schemas.Incident,
    dependencies=[Depends(get_current_user)],
)
def update_incident(
    incident_id: int,
    incident_in: schemas.IncidentUpdate,
    db: Session = Depends(database.get_db),
):
    db_inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not db_inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")

    update_data = incident_in.model_dump(exclude_unset=True)
    if "severity" in update_data and hasattr(update_data["severity"], "value"):
        update_data["severity"] = update_data["severity"].value

    for key, value in update_data.items():
        if key == "alert_ids" and value is not None:
            alerts = db.query(Alert).filter(Alert.id.in_(value)).all()
            db_inc.alerts = alerts
        elif hasattr(db_inc, key):
            setattr(db_inc, key, value)

    db.commit()
    db.refresh(db_inc)
    return db_inc


@router.delete(
    "/incidents/{incident_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_current_user)],
)
def delete_incident(incident_id: int, db: Session = Depends(database.get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    db.delete(inc)
    db.commit()
    return None


@router.post(
    "/incidents/{incident_id}/trigger_playbook",
    response_model=schemas.PlaybookExecution,
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(get_current_user)],
)
def trigger_playbook_for_incident(
    incident_id: int,
    playbook_id: int,
    db: Session = Depends(database.get_db),
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    pb = db.query(Playbook).filter(Playbook.id == playbook_id).first()
    if not pb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Playbook not found")

    db_exec = PlaybookExecution(
        playbook_id=playbook_id,
        incident_id=incident_id,
        status=PlaybookStatus.pending,
        logs=[],
    )
    db.add(db_exec)
    db.commit()
    db.refresh(db_exec)

    execute_playbook(db_exec.id, db)
    db.refresh(db_exec)
    db_exec.playbook_name = pb.name
    return db_exec
