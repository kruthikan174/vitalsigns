import asyncio
import websockets
import json
import time
import random
import math
import base64
import struct

WS_URL     = "ws://localhost:8000/ws/ingest"
PATIENT_ID = None   # will be fetched from DB automatically — set manually if needed

# ── fetch patient id from DB ──────────────────────────────────────────
def get_first_patient_id():
    import sys, os
    backend_path = os.path.join(os.path.dirname(__file__), "backend")
    sys.path.insert(0, backend_path)
    
    # point to the correct db location
    os.environ.setdefault("DATABASE_URL", f"sqlite:///{os.path.join(backend_path, 'vitalsigns.db')}")
    
    from database import SessionLocal
    import models
    db = SessionLocal()
    patient = db.query(models.Patient).first()
    db.close()
    return patient.id if patient else None

# ── fake camera frame (colored JPEG) ────────────────────────────────
def make_fake_frame(state: str) -> str:
    color_map = {
        "Normal":    (34,  197, 94),   # green
        "Stress":    (245, 158, 11),   # amber
        "Irregular": (239, 68,  68),   # red
    }
    r, g, b = color_map.get(state, (100, 100, 100))

    # minimal valid 4x4 JPEG with solid color (base64)
    # we'll just build a BMP-style raw block and encode it
    width, height = 64, 36
    pixels = bytes([b, g, r] * width * height)   # BGR for BMP

    # Build a minimal BMP
    def bmp(pixels, w, h):
        row_size = (w * 3 + 3) & ~3
        pad = row_size - w * 3
        pixel_data = b""
        for y in range(h - 1, -1, -1):
            row = pixels[y * w * 3 : (y + 1) * w * 3]
            pixel_data += row + b"\x00" * pad
        file_size = 54 + len(pixel_data)
        return (
            b"BM" +
            struct.pack("<I", file_size) +
            b"\x00\x00\x00\x00" +
            struct.pack("<I", 54) +
            struct.pack("<I", 40) +
            struct.pack("<i", w) +
            struct.pack("<i", h) +
            struct.pack("<H", 1) +
            struct.pack("<H", 24) +
            b"\x00" * 24 +
            pixel_data
        )

    raw = bmp(pixels, width, height)
    return base64.b64encode(raw).decode()

# ── vitals generator ─────────────────────────────────────────────────
class VitalsGenerator:
    def __init__(self):
        self.state      = "Normal"
        self.step       = 0
        self.state_steps = 0
        self.max_steps  = random.randint(4, 8)   # batches before state change

    def next_state(self):
        transitions = {
            "Normal":    ["Normal", "Normal", "Stress"],
            "Stress":    ["Stress", "Normal", "Irregular"],
            "Irregular": ["Irregular", "Stress"],
        }
        self.state = random.choice(transitions[self.state])
        self.max_steps = random.randint(4, 10)
        self.state_steps = 0
        print(f"\n🔄 State changed → {self.state}\n")

    def generate_row(self):
        self.step += 1
        t = self.step * 0.5

        if self.state == "Normal":
            ecg_hr     = 72  + 5  * math.sin(t * 0.3) + random.gauss(0, 1.5)
            radar_hr   = 70  + 4  * math.sin(t * 0.3) + random.gauss(0, 2.0)
            rr_mean    = 15  + 1  * math.sin(t * 0.2) + random.gauss(0, 0.3)
            hrv        = 0.08 + random.gauss(0, 0.005)
            rmssd      = 0.05 + random.gauss(0, 0.003)
            ecg_hr_std = random.gauss(2.0, 0.3)
            rr_std     = random.gauss(0.4, 0.05)
        elif self.state == "Stress":
            ecg_hr     = 115 + 10 * math.sin(t * 0.4) + random.gauss(0, 3.0)
            radar_hr   = 112 + 8  * math.sin(t * 0.4) + random.gauss(0, 3.0)
            rr_mean    = 22  + 3  * math.sin(t * 0.3) + random.gauss(0, 0.8)
            hrv        = 0.03 + random.gauss(0, 0.003)
            rmssd      = 0.02 + random.gauss(0, 0.002)
            ecg_hr_std = random.gauss(6.0, 0.5)
            rr_std     = random.gauss(1.2, 0.1)
        else:  # Irregular
            ecg_hr     = 145 + 20 * math.sin(t * 0.6) + random.gauss(0, 8.0)
            radar_hr   = 140 + 15 * math.sin(t * 0.5) + random.gauss(0, 6.0)
            rr_mean    = 28  + 6  * math.sin(t * 0.4) + random.gauss(0, 2.0)
            hrv        = 0.25 + random.gauss(0, 0.02)
            rmssd      = 0.20 + random.gauss(0, 0.015)
            ecg_hr_std = random.gauss(15.0, 1.5)
            rr_std     = random.gauss(3.5, 0.3)

        hr_fused = 0.7 * ecg_hr + 0.3 * radar_hr

        return {
            "timestamp":      time.time(),
            "ECG_HR_mean":    round(ecg_hr,      2),
            "ECG_HR_std":     round(abs(ecg_hr_std), 3),
            "HRV":            round(abs(hrv),     5),
            "RMSSD":          round(abs(rmssd),   5),
            "RR_mean":        round(rr_mean,      2),
            "RR_std":         round(abs(rr_std),  3),
            "RR_count":       random.randint(6, 10),
            "Radar_HR_mean":  round(radar_hr,     2),
            "HR_fused":       round(hr_fused,     2),
            "label":          -1,
        }

    def generate_batch(self):
        self.state_steps += 1
        if self.state_steps >= self.max_steps:
            self.next_state()
        return [self.generate_row() for _ in range(7)]


# ── main loop ────────────────────────────────────────────────────────
async def run(patient_id: str):
    gen = VitalsGenerator()
    print(f"🚀 Simulator starting for patient: {patient_id}")
    print(f"🔗 Connecting to {WS_URL}\n")

    while True:
        try:
            async with websockets.connect(WS_URL) as ws:
                print("✅ Connected to backend\n")
                batch_num = 0

                while True:
                    batch  = gen.generate_batch()
                    frame  = make_fake_frame(gen.state)
                    latest = batch[-1]

                    payload = {
                        "patient_id":   patient_id,
                        "batch":        batch,
                        "camera_frame": frame,
                    }

                    await ws.send(json.dumps(payload))
                    batch_num += 1

                    print(
                        f"📦 Batch {batch_num:03d} | State: {gen.state:10s} | "
                        f"HR: {latest['HR_fused']:5.1f} bpm | "
                        f"RR: {latest['RR_mean']:4.1f} br/min"
                    )
                    await asyncio.sleep(10)   # one batch every 10 seconds

        except Exception as e:
            print(f"❌ Connection error: {e}")
            print("🔁 Retrying in 3 seconds...")
            await asyncio.sleep(3)


if __name__ == "__main__":
    pid = PATIENT_ID or get_first_patient_id()
    if not pid:
        print("❌ No patient found in DB. Run seed.py first.")
    else:
        asyncio.run(run(pid))