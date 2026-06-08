import { useEffect, useState } from "react";
import api from "../utils/api";

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = async () => {
    try {
      const res = await api.get("/api/alerts/");
      setAlerts(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 10000);
    return () => clearInterval(id);
  }, []);

  const markSeen = async (id) => {
    await api.patch(`/api/alerts/${id}/seen`);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, seen: true } : a));
  };

  const unseen = alerts.filter(a => !a.seen);
  const seen   = alerts.filter(a => a.seen).slice(0, 5);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>
          Alerts
          {unseen.length > 0 && (
            <span style={{
              marginLeft: 8, background: "var(--irregular)",
              color: "#fff", borderRadius: 999,
              padding: "2px 8px", fontSize: 11
            }}>{unseen.length}</span>
          )}
        </h3>
      </div>

      {alerts.length === 0 && (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>No alerts yet.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
        {[...unseen, ...seen].map(alert => (
          <div key={alert.id} style={{
            background: alert.seen ? "transparent" : "var(--surface2)",
            border: `1px solid ${alert.alert_type === "irregular" ? "var(--irregular)" : "var(--stress)"}`,
            borderRadius: 8, padding: "10px 14px",
            opacity: alert.seen ? 0.5 : 1
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{
                fontSize: 12, fontWeight: 600, textTransform: "uppercase",
                color: alert.alert_type === "irregular" ? "var(--irregular)" : "var(--stress)"
              }}>
                {alert.alert_type === "irregular" ? "🚨" : "⚠️"} {alert.alert_type}
              </span>
              {!alert.seen && (
                <button
                  onClick={() => markSeen(alert.id)}
                  style={{
                    fontSize: 11, padding: "2px 8px",
                    background: "transparent", border: "1px solid var(--border)",
                    color: "var(--muted)", borderRadius: 6
                  }}
                >
                  Dismiss
                </button>
              )}
            </div>
            <p style={{ marginTop: 4, fontSize: 13 }}>{alert.message}</p>
            <p style={{ marginTop: 2, fontSize: 11, color: "var(--muted)" }}>
              {new Date(alert.created_at).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}