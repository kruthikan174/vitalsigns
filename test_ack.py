import asyncio
import websockets
import json
import time

async def main():
    async with websockets.connect("ws://localhost:8000/ws/ingest") as ws:
        batch = [{
            "timestamp": time.time(),
            "ECG_HR_mean": 75, "ECG_HR_std": 2, "HRV": 0.08, "RMSSD": 0.05,
            "RR_mean": 15, "RR_std": 0.4, "RR_count": 8,
            "Radar_HR_mean": 73, "HR_fused": 74.4
        } for _ in range(7)]

        payload = {
            "patient_id": "99f67112-821f-4cc5-b154-3b7b807d6955",  # use a real patient id from your DB
            "batch": batch,
            "camera_frame": None
        }
        await ws.send(json.dumps(payload))
        response = await ws.recv()
        print("✅ Got response:", response)

asyncio.run(main())