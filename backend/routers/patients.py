from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import require_clinician, get_current_user
import models, schemas

router = APIRouter(tags=["patients"])

@router.get("/", response_model=list[schemas.PatientOut])
def list_patients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_clinician)
):
    patients = db.query(models.Patient).filter(
        models.Patient.assigned_to == current_user.id
    ).all()

    result = []
    for p in patients:
        user = db.query(models.User).filter(models.User.id == p.user_id).first()
        result.append(schemas.PatientOut(
            id=p.id,
            user_id=p.user_id,
            age=p.age,
            gender=p.gender,
            condition=p.condition,
            name=user.name if user else "Unknown",
            email=user.email if user else ""
        ))
    return result


@router.get("/{patient_id}", response_model=schemas.PatientOut)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    patient = db.query(models.Patient).filter(
        models.Patient.id == patient_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    user = db.query(models.User).filter(models.User.id == patient.user_id).first()
    return schemas.PatientOut(
        id=patient.id,
        user_id=patient.user_id,
        age=patient.age,
        gender=patient.gender,
        condition=patient.condition,
        name=user.name if user else "Unknown",
        email=user.email if user else ""
    )


@router.get("/me/profile", response_model=schemas.PatientOut)
def my_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    patient = db.query(models.Patient).filter(
        models.Patient.user_id == current_user.id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    return schemas.PatientOut(
        id=patient.id,
        user_id=patient.user_id,
        age=patient.age,
        gender=patient.gender,
        condition=patient.condition,
        name=current_user.name,
        email=current_user.email
    )