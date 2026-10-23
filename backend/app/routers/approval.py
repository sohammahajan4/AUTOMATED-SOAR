from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from .. import database, schemas
from ..models import PlaybookExecution, PlaybookStatus
from ..playbook_engine import execute_playbook
from ..dependencies import get_current_user

router = APIRouter()


@router.get(
    "/approvals/pending",
    response_model=List[schemas.PlaybookExecution],
    dependencies=[Depends(get_current_user)],
)
def list_pending_approvals(db: Session = Depends(database.get_db)):
    """List all playbook executions waiting for human approval."""
    executions = (
        db.query(PlaybookExecution)
        .filter(PlaybookExecution.status == PlaybookStatus.waiting_approval)
        .order_by(PlaybookExecution.start_time.desc())
        .all()
    )
    for e in executions:
        if e.playbook:
            e.playbook_name = e.playbook.name
    return executions


@router.post(
    "/executions/{execution_id}/approve",
    response_model=schemas.PlaybookExecution,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(get_current_user)],
)
def approve_execution(
    execution_id: int,
    db: Session = Depends(database.get_db),
):
    exec_rec = db.query(PlaybookExecution).filter(PlaybookExecution.id == execution_id).first()
    if not exec_rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Execution not found")
    if exec_rec.status != PlaybookStatus.waiting_approval:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Execution is not awaiting approval (current status: {exec_rec.status})",
        )

    # Mark approved and resume execution
    exec_rec.approved = True
    exec_rec.status = PlaybookStatus.running
    current_logs = list(exec_rec.logs or [])
    current_logs.append({
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "step": "approval_gate",
        "level": "INFO",
        "message": "ACTION APPROVED: SOC Lead approved execution to resume next steps",
    })
    exec_rec.logs = current_logs
    flag_modified(exec_rec, "logs")
    db.commit()

    # Continue execution from the next step
    execute_playbook(exec_rec.id, db)
    db.refresh(exec_rec)
    if exec_rec.playbook:
        exec_rec.playbook_name = exec_rec.playbook.name
    return exec_rec


@router.post(
    "/executions/{execution_id}/reject",
    response_model=schemas.PlaybookExecution,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(get_current_user)],
)
def reject_execution(
    execution_id: int,
    db: Session = Depends(database.get_db),
):
    exec_rec = db.query(PlaybookExecution).filter(PlaybookExecution.id == execution_id).first()
    if not exec_rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Execution not found")
    if exec_rec.status != PlaybookStatus.waiting_approval:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Execution is not awaiting approval (current status: {exec_rec.status})",
        )

    exec_rec.approved = False
    exec_rec.status = PlaybookStatus.cancelled
    exec_rec.end_time = datetime.utcnow()
    current_logs = list(exec_rec.logs or [])
    current_logs.append({
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "step": "approval_gate",
        "level": "WARN",
        "message": "ACTION REJECTED: Execution aborted by SOC Lead",
    })
    exec_rec.logs = current_logs
    flag_modified(exec_rec, "logs")
    db.commit()
    db.refresh(exec_rec)
    if exec_rec.playbook:
        exec_rec.playbook_name = exec_rec.playbook.name
    return exec_rec
