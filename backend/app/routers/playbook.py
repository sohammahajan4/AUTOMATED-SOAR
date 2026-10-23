from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schemas, database
from ..models import Playbook, PlaybookExecution, PlaybookStatus
from ..playbook_engine import execute_playbook
from ..dependencies import get_current_user

router = APIRouter()


@router.post(
    "/playbooks",
    response_model=schemas.Playbook,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_user)],
)
def create_playbook(pb: schemas.PlaybookCreate, db: Session = Depends(database.get_db)):
    existing = db.query(Playbook).filter(Playbook.name == pb.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Playbook name already exists")
    db_pb = Playbook(
        name=pb.name,
        description=pb.description,
        definition=pb.definition,
        enabled=pb.enabled,
    )
    db.add(db_pb)
    db.commit()
    db.refresh(db_pb)
    return db_pb


@router.get(
    "/playbooks",
    response_model=List[schemas.Playbook],
    dependencies=[Depends(get_current_user)],
)
def list_playbooks(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(Playbook).offset(skip).limit(limit).all()


@router.get(
    "/playbooks/{playbook_id}",
    response_model=schemas.Playbook,
    dependencies=[Depends(get_current_user)],
)
def get_playbook(playbook_id: int, db: Session = Depends(database.get_db)):
    pb = db.query(Playbook).filter(Playbook.id == playbook_id).first()
    if not pb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Playbook not found")
    return pb


@router.put(
    "/playbooks/{playbook_id}",
    response_model=schemas.Playbook,
    dependencies=[Depends(get_current_user)],
)
def update_playbook(
    playbook_id: int,
    pb_update: schemas.PlaybookUpdate,
    db: Session = Depends(database.get_db),
):
    pb = db.query(Playbook).filter(Playbook.id == playbook_id).first()
    if not pb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Playbook not found")

    data = pb_update.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(pb, key, value)

    db.commit()
    db.refresh(pb)
    return pb


@router.delete(
    "/playbooks/{playbook_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_current_user)],
)
def delete_playbook(playbook_id: int, db: Session = Depends(database.get_db)):
    pb = db.query(Playbook).filter(Playbook.id == playbook_id).first()
    if not pb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Playbook not found")
    db.delete(pb)
    db.commit()
    return None


@router.post(
    "/playbooks/{playbook_id}/execute",
    response_model=schemas.PlaybookExecution,
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(get_current_user)],
)
def run_playbook(playbook_id: int, incident_id: Optional[int] = None, db: Session = Depends(database.get_db)):
    pb = db.query(Playbook).filter(Playbook.id == playbook_id).first()
    if not pb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Playbook not found")
    if not pb.enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Playbook is disabled")

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


@router.get(
    "/executions",
    response_model=List[schemas.PlaybookExecution],
    dependencies=[Depends(get_current_user)],
)
def list_executions(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    executions = db.query(PlaybookExecution).order_by(PlaybookExecution.start_time.desc()).offset(skip).limit(limit).all()
    for e in executions:
        if e.playbook:
            e.playbook_name = e.playbook.name
    return executions


@router.get(
    "/executions/{execution_id}",
    response_model=schemas.PlaybookExecution,
    dependencies=[Depends(get_current_user)],
)
def get_execution(execution_id: int, db: Session = Depends(database.get_db)):
    exec_rec = db.query(PlaybookExecution).filter(PlaybookExecution.id == execution_id).first()
    if not exec_rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Execution not found")
    if exec_rec.playbook:
        exec_rec.playbook_name = exec_rec.playbook.name
    return exec_rec
