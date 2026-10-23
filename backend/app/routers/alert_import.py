import csv
import io
import json
import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session

from .. import schemas, database
from ..models import Alert
from ..dependencies import get_current_user

router = APIRouter()


@router.post(
    "/alerts/import",
    response_model=List[schemas.Alert],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_user)],
)
async def import_alerts(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    """Bulk import alerts from a CSV or JSON file."""
    filename = (file.filename or "").lower()
    content = await file.read()

    alerts_data = []
    if filename.endswith(".csv") or file.content_type == "text/csv":
        text_stream = io.StringIO(content.decode("utf-8", errors="ignore"))
        reader = csv.DictReader(text_stream)
        for row in reader:
            if "severity" in row and row["severity"]:
                row["severity"] = row["severity"].strip().lower()
            if not row.get("event_id"):
                row["event_id"] = f"EVT-CSV-{uuid.uuid4().hex[:8].upper()}"
            alerts_data.append(row)
    elif filename.endswith(".json") or file.content_type in ["application/json", "text/json"]:
        parsed = json.loads(content.decode("utf-8"))
        alerts_data = parsed if isinstance(parsed, list) else [parsed]
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Please upload a .csv or .json file.",
        )

    created = []
    for item in alerts_data:
        try:
            alert_in = schemas.AlertCreate(**item)
            existing = db.query(Alert).filter(Alert.event_id == alert_in.event_id).first()
            if existing:
                continue

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
            created.append(db_alert)
        except Exception:
            continue

    db.commit()
    for a in created:
        db.refresh(a)
    return created
