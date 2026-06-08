from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from database import get_db
from auth import get_current_user
import models, schemas

router = APIRouter(tags=["sessions"])

@router.get("/patient/{patient_id}", response_model=list[schemas.SessionOut])
def get_sessions_for_patient(
    patient_id: str,
    db: DBSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sessions = db.query(models.Session).filter(
        models.Session.patient_id == patient_id
    ).order_by(models.Session.started_at.desc()).limit(20).all()
    return sessions


@router.get("/{session_id}", response_model=schemas.SessionOut)
def get_session(
    session_id: str,
    db: DBSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.Session).filter(
        models.Session.id == session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session