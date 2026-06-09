import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PatientTable from "../components/PatientTable";
import AlertsPanel from "../components/AlertsPanel";
import LiveChart from "../components/LiveChart";
import StateBadge from "../components/StateBadge";
import CameraFeed from "../components/CameraFeed";
import { useClinicianSocket } from "../hooks/useVitalsSocket";
import api from "../utils/api";

export default function ClinicianDashboard() {
  const [patients,   setPatients]   = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [chartData,  setChartData]  = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const { feed, connected } = useClinicianSocket();
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    api.get("/api/patients/").then(r => {
      setPatients(r.data);
      if (r.data.length > 0) setSelectedId(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    api.get("/api/requests/pending")
      .then(r => setPendingRequests(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId || !feed[selectedId]?.vitals) return;
    setChartData(prev => [...prev.slice(-80), feed[selectedId].vitals]);
  }, [feed, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    setChartData([]);
    api.get(`/api/sessions/patient/${selectedId}`)
      .then(r => setSessions(r.data))
      .catch(() => setSessions([]));
  }, [selectedId]);

  const selectedPatient = patients.find(p => p.id === selectedId);
  const selectedLive    = feed[selectedId];
  const prediction      = selectedLive?.prediction;
  const cameraFrame     = selectedLive?.camera_frame;
  const activeCount     = Object.keys(feed).length;
  const alertCount      = Object.values(feed).filter(
    f => f?.prediction?.label === "Stress" || f?.prediction?.label === "Irregular"
  ).length;
  const acceptRequest = async (id) => {
    try {
      await api.post(`/api/requests/${id}/accept`);

      setPendingRequests(prev =>
        prev.filter(r => r.request_id !== id)
      );

      const patientsRes = await api.get("/api/patients/");
      setPatients(patientsRes.data);
      if (!selectedId && patientsRes.data.length > 0) {
        setSelectedId(patientsRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const rejectRequest = async (id) => {
    try {
      await api.post(`/api/requests/${id}/reject`);

      setPendingRequests(prev =>
        prev.filter(r => r.request_id !== id)
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar title="Clinician Dashboard" />
      <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>

        {/* stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Patients",  value: patients.length, icon: "👥" },
            { label: "Active Sessions", value: activeCount,     icon: "📡" },
            { label: "Alerts Active",   value: alertCount,      icon: "🚨" },
            { label: "WS Connection",   value: connected ? "Live" : "Offline", icon: connected ? "🟢" : "🔴" },
          ].map(s => (
            <div key={s.label} className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {pendingRequests.length > 0 && (
              <div className="card">
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    marginBottom: 16
                  }}
                >
                  Pending Requests
                </h2>

                {pendingRequests.map(req => (
                  <div
                    key={req.request_id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: "1px solid var(--border)"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {req.patient_name}
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--muted)"
                        }}
                      >
                        {req.patient_email}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn-primary"
                        onClick={() =>
                          acceptRequest(req.request_id)
                        }
                      >
                        Accept
                      </button>

                      <button
                        className="btn-ghost"
                        onClick={() =>
                          rejectRequest(req.request_id)
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}  

            {/* patient table */}
            <div className="card">
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Assigned Patients</h2>
              <PatientTable
                patients={patients}
                liveFeed={feed}
                onSelect={setSelectedId}
                selectedId={selectedId}
              />
            </div>

            {/* detail panel */}
            {selectedPatient && (
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 600 }}>{selectedPatient.name}</h2>
                    <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                      {selectedPatient.condition} · Age {selectedPatient.age} · {selectedPatient.gender}
                    </p>
                  </div>
                  {prediction && <StateBadge label={prediction.label} large />}
                </div>

                {/* vitals numbers */}
                {selectedLive?.vitals && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                    {[
                      { label: "HR (ECG)",    value: selectedLive.vitals.ECG_HR_mean?.toFixed(1),   unit: "bpm" },
                      { label: "HR (Radar)",  value: selectedLive.vitals.Radar_HR_mean?.toFixed(1), unit: "bpm" },
                      { label: "HR (Fused)",  value: selectedLive.vitals.HR_fused?.toFixed(1),      unit: "bpm" },
                      { label: "Respiration", value: selectedLive.vitals.RR_mean?.toFixed(1),        unit: "br/min" },
                    ].map(v => (
                      <div key={v.label} style={{
                        background: "var(--surface2)", borderRadius: 8,
                        padding: "12px 14px", textAlign: "center"
                      }}>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>{v.value ?? "—"}</div>
                        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{v.unit}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{v.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* charts */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div style={{ background: "var(--surface2)", borderRadius: 8, padding: 14 }}>
                    <LiveChart
                      data={chartData}
                      keys={["ECG_HR", "Radar_HR", "HR_fused"]}
                      colors={["#4f8ef7", "#a78bfa", "#22c55e"]}
                      title="Heart Rate (bpm)"
                    />
                  </div>
                  <div style={{ background: "var(--surface2)", borderRadius: 8, padding: 14 }}>
                    <LiveChart
                      data={chartData}
                      keys={["RR"]}
                      colors={["#f59e0b"]}
                      title="Respiration Rate (br/min)"
                    />
                  </div>
                </div>

                {/* confidence bars */}
                {prediction && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 10 }}>Model confidence</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { label: "Normal",    val: prediction.confidence.Normal,    color: "var(--normal)" },
                        { label: "Stress",    val: prediction.confidence.Stress,    color: "var(--stress)" },
                        { label: "Irregular", val: prediction.confidence.Irregular, color: "var(--irregular)" },
                      ].map(c => (
                        <div key={c.label}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: "var(--muted)" }}>{c.label}</span>
                            <span style={{ color: c.color, fontWeight: 600 }}>{(c.val * 100).toFixed(1)}%</span>
                          </div>
                          <div style={{ background: "var(--surface2)", borderRadius: 999, height: 6 }}>
                            <div style={{
                              width: `${c.val * 100}%`, height: "100%",
                              background: c.color, borderRadius: 999,
                              transition: "width 0.5s ease"
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* HRV / RMSSD */}
                {selectedLive?.vitals && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {[
                      { label: "HRV",    value: selectedLive.vitals.HRV?.toFixed(3) },
                      { label: "RMSSD",  value: selectedLive.vitals.RMSSD?.toFixed(3) },
                      { label: "RR Std", value: selectedLive.vitals.RR_std?.toFixed(3) },
                    ].map(v => (
                      <div key={v.label} style={{
                        background: "var(--surface2)", borderRadius: 8,
                        padding: "10px 14px", textAlign: "center"
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{v.value ?? "—"}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{v.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* session history */}
            {sessions.length > 0 && (
              <div className="card">
                <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Session History</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sessions.map(s => (
                    <div key={s.id} style={{
                      background: "var(--surface2)", borderRadius: 8,
                      padding: "10px 14px",
                      display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                          {new Date(s.started_at).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                          {s.readings?.length ?? 0} readings
                        </div>
                      </div>
                      {s.final_state && <StateBadge label={s.final_state} />}
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
              <AlertsPanel />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}