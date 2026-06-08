from fastapi import WebSocket
from collections import defaultdict
import asyncio

class WebSocketHub:
    def __init__(self):
        # patient_id -> list of connected browser clients
        self.patient_connections: dict[str, list[WebSocket]] = defaultdict(list)
        # clinician connections (receive all patients' data)
        self.clinician_connections: list[WebSocket] = []

    async def connect_patient_viewer(self, patient_id: str, ws: WebSocket):
        await ws.accept()
        self.patient_connections[patient_id].append(ws)

    async def connect_clinician(self, ws: WebSocket):
        await ws.accept()
        self.clinician_connections.append(ws)

    def disconnect_patient_viewer(self, patient_id: str, ws: WebSocket):
        if ws in self.patient_connections[patient_id]:
            self.patient_connections[patient_id].remove(ws)

    def disconnect_clinician(self, ws: WebSocket):
        if ws in self.clinician_connections:
            self.clinician_connections.remove(ws)

    async def broadcast_to_patient(self, patient_id: str, data: dict):
        dead = []
        for ws in self.patient_connections.get(patient_id, []):
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_patient_viewer(patient_id, ws)

    async def broadcast_to_clinicians(self, data: dict):
        dead = []
        for ws in self.clinician_connections:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_clinician(ws)

    async def broadcast(self, patient_id: str, data: dict):
        payload = {"patient_id": patient_id, **data}
        await asyncio.gather(
            self.broadcast_to_patient(patient_id, payload),
            self.broadcast_to_clinicians(payload)
        )

# single shared instance imported everywhere
hub = WebSocketHub()