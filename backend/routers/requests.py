from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from auth import require_patient, require_clinician
import models
import schemas

router = APIRouter(tags=["requests"])


# --------------------------------------------------
# Patient sends request to clinician
# --------------------------------------------------
@router.post("/connect")
def connect_to_doctor(
    req: schemas.ConnectDoctorRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_patient)
):
    # Get patient profile
    patient = db.query(models.Patient).filter(
        models.Patient.user_id == current_user.id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    # Find clinician
    doctor = db.query(models.User).filter(
        models.User.email == req.doctor_email,
        models.User.role == "clinician"
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Clinician not found"
        )

    # Already assigned
    if patient.assigned_to:
        raise HTTPException(
            status_code=400,
            detail="Patient already assigned to a clinician"
        )

    # Existing pending request?
    existing = db.query(models.PatientRequest).filter(
        models.PatientRequest.patient_id == patient.id,
        models.PatientRequest.clinician_id == doctor.id,
        models.PatientRequest.status == "pending"
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Request already pending"
        )

    new_request = models.PatientRequest(
        patient_id=patient.id,
        clinician_id=doctor.id,
        status="pending"
    )

    db.add(new_request)
    db.commit()

    return {
        "message": "Request sent successfully"
    }


# --------------------------------------------------
# Clinician views pending requests
# --------------------------------------------------
@router.get("/pending")
def get_pending_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_clinician)
):
    requests = db.query(models.PatientRequest).filter(
        models.PatientRequest.clinician_id == current_user.id,
        models.PatientRequest.status == "pending"
    ).all()

    result = []

    for req in requests:
        patient = db.query(models.Patient).filter(
            models.Patient.id == req.patient_id
        ).first()

        if not patient:
            continue

        user = db.query(models.User).filter(
            models.User.id == patient.user_id
        ).first()

        if not user:
            continue

        result.append({
            "request_id": req.id,
            "patient_id": patient.id,
            "patient_name": user.name,
            "patient_email": user.email,
            "created_at": req.created_at
        })

    return result


# --------------------------------------------------
# Clinician accepts request
# --------------------------------------------------
@router.post("/{request_id}/accept")
def accept_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_clinician)
):
    request = db.query(models.PatientRequest).filter(
        models.PatientRequest.id == request_id,
        models.PatientRequest.clinician_id == current_user.id
    ).first()

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    patient = db.query(models.Patient).filter(
        models.Patient.id == request.patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    patient.assigned_to = current_user.id
    request.status = "accepted"

    db.commit()

    return {
        "message": "Patient assigned successfully"
    }


# --------------------------------------------------
# Clinician rejects request
# --------------------------------------------------
@router.post("/{request_id}/reject")
def reject_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_clinician)
):
    request = db.query(models.PatientRequest).filter(
        models.PatientRequest.id == request_id,
        models.PatientRequest.clinician_id == current_user.id
    ).first()

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    request.status = "rejected"

    db.commit()

    return {
        "message": "Request rejected"
    }