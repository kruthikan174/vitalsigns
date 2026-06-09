from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# -------- Auth --------
class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str
    role: str                  # "clinician" or "patient"
    age: Optional[int] = None
    gender: Optional[str] = None
    condition: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: str

# -------- Patient --------
class PatientOut(BaseModel):
    id: str
    user_id: str
    age: Optional[int]
    gender: Optional[str]
    condition: Optional[str]
    name: str
    email: str

    class Config:
        from_attributes = True

# -------- Reading --------
class ReadingOut(BaseModel):
    id: str
    timestamp: float
    ecg_hr_mean: float
    ecg_hr_std: float
    hrv: float
    rmssd: float
    rr_mean: float
    rr_std: float
    rr_count: int
    radar_hr_mean: float
    hr_fused: float
    prediction: Optional[str]
    confidence_normal: Optional[float]
    confidence_stress: Optional[float]
    confidence_irregular: Optional[float]

    class Config:
        from_attributes = True

# -------- Session --------
class SessionOut(BaseModel):
    id: str
    patient_id: str
    started_at: datetime
    ended_at: Optional[datetime]
    final_state: Optional[str]
    readings: List[ReadingOut] = []

    class Config:
        from_attributes = True

# -------- Alert --------
class AlertOut(BaseModel):
    id: str
    patient_id: str
    alert_type: str
    message: str
    seen: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ConnectDoctorRequest(BaseModel):
    doctor_email: str


class PendingRequestOut(BaseModel):
    request_id: str
    patient_id: str
    patient_name: str
    patient_email: str
    created_at: datetime