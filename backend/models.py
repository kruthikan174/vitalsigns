from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id               = Column(String, primary_key=True, default=gen_uuid)
    email            = Column(String, unique=True, index=True, nullable=False)
    name             = Column(String, nullable=False)
    hashed_password  = Column(String, nullable=False)
    role             = Column(String, nullable=False)  # "clinician" or "patient"
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    # explicitly tell SQLAlchemy which FK to use
    patient = relationship(
        "Patient",
        back_populates="user",
        foreign_keys="Patient.user_id",
        uselist=False
    )


class Patient(Base):
    __tablename__ = "patients"

    id          = Column(String, primary_key=True, default=gen_uuid)
    user_id     = Column(String, ForeignKey("users.id"), unique=True)
    age         = Column(Integer)
    gender      = Column(String)
    condition   = Column(String)
    assigned_to = Column(String, ForeignKey("users.id"), nullable=True)

    user = relationship(
        "User",
        back_populates="patient",
        foreign_keys=[user_id]
    )
    sessions = relationship("Session", back_populates="patient")
    alerts   = relationship("Alert",   back_populates="patient")


class Session(Base):
    __tablename__ = "sessions"

    id          = Column(String, primary_key=True, default=gen_uuid)
    patient_id  = Column(String, ForeignKey("patients.id"))
    started_at  = Column(DateTime(timezone=True), server_default=func.now())
    ended_at    = Column(DateTime(timezone=True), nullable=True)
    final_state = Column(String, nullable=True)

    patient  = relationship("Patient", back_populates="sessions")
    readings = relationship("Reading", back_populates="session")


class Reading(Base):
    __tablename__ = "readings"

    id                   = Column(String, primary_key=True, default=gen_uuid)
    session_id           = Column(String, ForeignKey("sessions.id"))
    timestamp            = Column(Float)
    ecg_hr_mean          = Column(Float)
    ecg_hr_std           = Column(Float)
    hrv                  = Column(Float)
    rmssd                = Column(Float)
    rr_mean              = Column(Float)
    rr_std               = Column(Float)
    rr_count             = Column(Integer)
    radar_hr_mean        = Column(Float)
    hr_fused             = Column(Float)
    prediction           = Column(String)
    confidence_normal    = Column(Float)
    confidence_stress    = Column(Float)
    confidence_irregular = Column(Float)

    session = relationship("Session", back_populates="readings")


class Alert(Base):
    __tablename__ = "alerts"

    id         = Column(String, primary_key=True, default=gen_uuid)
    patient_id = Column(String, ForeignKey("patients.id"))
    session_id = Column(String, ForeignKey("sessions.id"), nullable=True)
    alert_type = Column(String)
    message    = Column(Text)
    seen       = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="alerts")

class PatientRequest(Base):
    __tablename__ = "patient_requests"

    id = Column(String, primary_key=True, default=gen_uuid)

    patient_id = Column(
        String,
        ForeignKey("patients.id"),
        nullable=False
    )

    clinician_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False
    )

    status = Column(
        String,
        default="pending"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )