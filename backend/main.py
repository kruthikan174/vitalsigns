from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, engine, Base
from ws_hub import hub
from ml.predictor import predict_batch
from routers import auth, patients, sessions, alerts
import models, time
from routers import requests

Base.metadata.create_all(bind=engine)

app = FastAPI(title="VitalSigns API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,     prefix="/api/auth")
app.include_router(patients.router, prefix="/api/patients")
app.include_router(sessions.router, prefix="/api/sessions")
app.include_router(alerts.router,   prefix="/api/alerts")
app.include_router(
    requests.router,
    prefix="/api/requests"
)

@app.get("/")
def root():
    return {"status": "VitalSigns API running"}


# ── Pi pushes data here ─────────────────────────────────────────────
@app.websocket("/ws/ingest")
async def ingest(ws: WebSocket, db: Session = Depends(get_db)):
    await ws.accept()
    active_sessions: dict[str, str] = {}   # patient_id -> session_id

    try:
        while True:
            data = await ws.receive_json()
            patient_id   = data.get("patient_id")
            batch        = data.get("batch", [])
            camera_frame = data.get("camera_frame")

            if not patient_id or not batch:
                continue

            # open a session if none active
            if patient_id not in active_sessions:
                new_session = models.Session(patient_id=patient_id)
                db.add(new_session)
                db.commit()
                db.refresh(new_session)
                active_sessions[patient_id] = new_session.id

            session_id = active_sessions[patient_id]
            prediction = predict_batch(batch)

            # save reading
            latest = batch[-1]
            reading = models.Reading(
                session_id           = session_id,
                timestamp            = latest.get("timestamp", time.time()),
                ecg_hr_mean          = latest.get("ECG_HR_mean", 0),
                ecg_hr_std           = latest.get("ECG_HR_std", 0),
                hrv                  = latest.get("HRV", 0),
                rmssd                = latest.get("RMSSD", 0),
                rr_mean              = latest.get("RR_mean", 0),
                rr_std               = latest.get("RR_std", 0),
                rr_count             = latest.get("RR_count", 0),
                radar_hr_mean        = latest.get("Radar_HR_mean", 0),
                hr_fused             = latest.get("HR_fused", 0),
                prediction           = prediction["label"],
                confidence_normal    = prediction["confidence"]["Normal"],
                confidence_stress    = prediction["confidence"]["Stress"],
                confidence_irregular = prediction["confidence"]["Irregular"],
            )
            db.add(reading)

            # create alert if stress or irregular
            if prediction["label"] in ("Stress", "Irregular"):
                alert = models.Alert(
                    patient_id = patient_id,
                    session_id = session_id,
                    alert_type = prediction["label"].lower(),
                    message    = (
                        f"Patient entered {prediction['label']} state. "
                        f"HR: {latest.get('HR_fused', 0):.1f} bpm"
                    )
                )
                db.add(alert)

            db.commit()

            # broadcast to browser clients
            await hub.broadcast(patient_id, {
                "vitals":       latest,
                "prediction":   prediction,
                "camera_frame": camera_frame,
                "session_id":   session_id,
            })

    except WebSocketDisconnect:
        # close any open sessions
        for patient_id, session_id in active_sessions.items():
            session = db.query(models.Session).filter(
                models.Session.id == session_id
            ).first()
            if session:
                from datetime import datetime
                session.ended_at    = datetime.utcnow()
                session.final_state = "ended"
                db.commit()


# ── Browser clients connect here ────────────────────────────────────
@app.websocket("/ws/live/clinician")
async def clinician_live(ws: WebSocket):
    await hub.connect_clinician(ws)
    try:
        while True:
            await ws.receive_text()   # keep alive
    except WebSocketDisconnect:
        hub.disconnect_clinician(ws)


@app.websocket("/ws/live/{patient_id}")
async def patient_live(ws: WebSocket, patient_id: str):
    await hub.connect_patient_viewer(patient_id, ws)
    try:
        while True:
            await ws.receive_text()   # keep alive
    except WebSocketDisconnect:
        hub.disconnect_patient_viewer(patient_id, ws)