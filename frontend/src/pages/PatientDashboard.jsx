import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import StateBadge from "../components/StateBadge";
import LiveChart from "../components/LiveChart";
import CameraFeed from "../components/CameraFeed";
import { useAuth } from "../context/AuthContext";
import { useVitalsSocket } from "../hooks/useVitalsSocket";
import api from "../utils/api";

export default function PatientDashboard() {
  const { user }   = useAuth();
  const [profile,  setProfile]  = useState(null);
  const [sessions, setSessions] = useState([]);
  const [patientId, setPatientId] = useState(null);
  const [doctorEmail, setDoctorEmail] = useState("");
  const [requestMsg, setRequestMsg] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);

  const { vitals, prediction, cameraFrame, connected } = useVitalsSocket(patientId);

  useEffect(() => {
    api.get("/api/patients/me/profile").then(r => {
      setProfile(r.data);
      setPatientId(r.data.id);
      api.get(`/api/sessions/patient/${r.data.id}`)
        .then(s => setSessions(s.data))
        .catch(() => {});
    });
  }, []);

  const latest = vitals[vitals.length - 1];

  const sendRequest = async () => {
    if (!doctorEmail.trim()) {
      setRequestMsg("Please enter a clinician email");
      return;
    }

    try {
      setRequestLoading(true);
      setRequestMsg("");

      const res = await api.post("/api/requests/connect", {
        doctor_email: doctorEmail
      });

      setRequestMsg(res.data.message);
      setDoctorEmail("");
      setRequestMsg("Request sent successfully!");
    } catch (err) {
      setRequestMsg(
        err.response?.data?.detail || "Failed to send request"
      );
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar title="My Health Monitor" />

      <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>

        {/* greeting */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>
            Hello, {user?.name} 👋
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 4 }}>
            {connected
              ? "🟢 Live monitoring active"
              : "🔴 Waiting for device connection..."}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>

          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* current state */}
            <div className="card" style={{ textAlign: "center", padding: 32 }}>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>
                Current health state
              </p>
              <StateBadge label={prediction?.label} large />

              {prediction && (
                <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8, maxWidth: 300, margin: "24px auto 0" }}>
                  {[
                    { label: "Normal",    val: prediction.confidence.Normal,    color: "var(--normal)" },
                    { label: "Stress",    val: prediction.confidence.Stress,    color: "var(--stress)" },
                    { label: "Irregular", val: prediction.confidence.Irregular, color: "var(--irregular)" },
                  ].map(c => (
                    <div key={c.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: "var(--muted)" }}>{c.label}</span>
                        <span style={{ color: c.color, fontWeight: 600 }}>{(c.val * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ background: "var(--surface2)", borderRadius: 999, height: 5 }}>
                        <div style={{
                          width: `${c.val * 100}%`, height: "100%",
                          background: c.color, borderRadius: 999,
                          transition: "width 0.5s ease"
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* vitals numbers */}
            {latest && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { label: "HR (ECG)",    value: latest.ECG_HR_mean?.toFixed(1),   unit: "bpm" },
                  { label: "HR (Radar)",  value: latest.Radar_HR_mean?.toFixed(1), unit: "bpm" },
                  { label: "HR (Fused)",  value: latest.HR_fused?.toFixed(1),      unit: "bpm" },
                  { label: "Respiration", value: latest.RR_mean?.toFixed(1),       unit: "br/min" },
                ].map(v => (
                  <div key={v.label} className="card" style={{ textAlign: "center", padding: "16px 10px" }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)" }}>{v.value}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{v.unit}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{v.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* charts */}
            <div className="card">
              <LiveChart
                data={vitals}
                keys={["ECG_HR", "Radar_HR", "HR_fused"]}
                colors={["#4f8ef7", "#a78bfa", "#22c55e"]}
                title="Heart Rate (bpm)"
              />
            </div>

            <div className="card">
              <LiveChart
                data={vitals}
                keys={["RR"]}
                colors={["#f59e0b"]}
                title="Respiration Rate (br/min)"
              />
            </div>

            {/* session history */}
            {sessions.length > 0 && (
              <div className="card">
                <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
                  Session History
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sessions.map(s => (
                    <div key={s.id} style={{
                      background: "var(--surface2)", borderRadius: 8,
                      padding: "10px 14px",
                      display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                      <div style={{ fontSize: 13 }}>
                        {new Date(s.started_at).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        {s.readings?.length ?? 0} readings
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card">
              <CameraFeed frame={cameraFrame} />
            </div>

            <div className="card">
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 14
                }}
              >
                Connect to Clinician
              </h3>

              <input
                type="email"
                value={doctorEmail}
                onChange={(e) => setDoctorEmail(e.target.value)}
                placeholder="doctor@example.com"
                style={{ marginBottom: 12 }}
              />

              <button
                className="btn-primary"
                style={{ width: "100%" }}
                onClick={sendRequest}
                disabled={requestLoading}
              >
                {requestLoading ? "Sending..." : "Send Request"}
              </button>

              {requestMsg && (
                <p
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "var(--muted)"
                  }}
                >
                  {requestMsg}
                </p>
              )}
            </div>

            {profile && (
              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>My Profile</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Name",      value: profile.name },
                    { label: "Email",     value: profile.email },
                    { label: "Age",       value: profile.age },
                    { label: "Gender",    value: profile.gender },
                    { label: "Condition", value: profile.condition },
                  ].map(f => (
                    <div key={f.label} style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: 13, borderBottom: "1px solid var(--border)", paddingBottom: 8
                    }}>
                      <span style={{ color: "var(--muted)" }}>{f.label}</span>
                      <span style={{ fontWeight: 500 }}>{f.value ?? "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}