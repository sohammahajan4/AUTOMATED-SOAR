import hmac
import hashlib
import json
import os
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .. import schemas, database
from ..models import Alert
from ..dependencies import get_current_user

router = APIRouter()

WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "supersecret")


@router.post(
    "/webhook",
    response_model=List[schemas.Alert],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_user)],
)
async def receive_webhook(request: Request, db: Session = Depends(database.get_db)):
    """Receive alert webhook with HMAC-SHA256 signature."""
    body = await request.body()
    signature = request.headers.get("X-Signature")

    if signature:
        expected = hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    try:
        payload = json.loads(body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")

    alerts_data = payload if isinstance(payload, list) else [payload]
    created = []
    for alert_data in alerts_data:
        try:
            alert_in = schemas.AlertCreate(**alert_data)
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
