from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth as auth_utils

router = APIRouter(tags=["auth"])

@router.post("/register")
def register(req: schemas.RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if req.role not in ("clinician", "patient"):
        raise HTTPException(status_code=400, detail="Role must be clinician or patient")

    user = models.User(
        email=req.email,
        name=req.name,
        hashed_password=auth_utils.hash_password(req.password),
        role=req.role
    )
    db.add(user)
    db.flush()  # get user.id before commit

    if req.role == "patient":
        patient = models.Patient(
            user_id=user.id,
            age=req.age,
            gender=req.gender,
            condition=req.condition
        )
        db.add(patient)

    db.commit()
    db.refresh(user)
    return {"message": "Registered successfully", "user_id": user.id}


@router.post("/login", response_model=schemas.LoginResponse)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == form.username).first()
    if not user or not auth_utils.verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth_utils.create_access_token({"sub": user.id, "role": user.role})
    return schemas.LoginResponse(
        access_token=token,
        role=user.role,
        user_id=user.id,
        name=user.name
    )


@router.get("/me")
def me(current_user: models.User = Depends(auth_utils.get_current_user)):
    return {
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }