from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_clinician
import models, schemas

router = APIRouter(tags=["alerts"])

@router.get("/", response_model=list[schemas.AlertOut])
def get_alerts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_clinician)
):
    # get all patients assigned to this clinician
    patients = db.query(models.Patient).filter(
        models.Patient.assigned_to == current_user.id
    ).all()
    patient_ids = [p.id for p in patients]

    alerts = db.query(models.Alert).filter(
        models.Alert.patient_id.in_(patient_ids)
    ).order_by(models.Alert.created_at.desc()).limit(50).all()
    return alerts


@router.patch("/{alert_id}/seen")
def mark_seen(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_clinician)
):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if alert:
        alert.seen = True
        db.commit()
    return {"ok": True}


@router.get("/patient/{patient_id}", response_model=list[schemas.AlertOut])
def get_alerts_for_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    alerts = db.query(models.Alert).filter(
        models.Alert.patient_id == patient_id
    ).order_by(models.Alert.created_at.desc()).limit(20).all()
    return alerts