import StateBadge from "./StateBadge";

export default function PatientTable({ patients, liveFeed, onSelect, selectedId }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
            <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500 }}>Patient</th>
            <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500 }}>Condition</th>
            <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500 }}>HR (fused)</th>
            <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500 }}>RR</th>
            <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500 }}>State</th>
            <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(p => {
            const live = liveFeed?.[p.id];
            const vitals = live?.vitals;
            const prediction = live?.prediction;
            const isSelected = selectedId === p.id;

            return (
              <tr key={p.id} style={{
                borderBottom: "1px solid var(--border)",
                background: isSelected ? "var(--surface2)" : "transparent",
                transition: "background 0.15s"
              }}>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div style={{ color: "var(--muted)", fontSize: 11 }}>{p.email}</div>
                </td>
                <td style={{ padding: "10px 12px", color: "var(--muted)" }}>{p.condition}</td>
                <td style={{ padding: "10px 12px" }}>
                  {vitals ? `${vitals.HR_fused?.toFixed(1)} bpm` : "—"}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {vitals ? `${vitals.RR_mean?.toFixed(1)} br/min` : "—"}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {prediction
                    ? <StateBadge label={prediction.label} />
                    : <span style={{ color: "var(--muted)" }}>Offline</span>
                  }
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <button
                    className="btn-ghost"
                    style={{ padding: "4px 12px", fontSize: 12 }}
                    onClick={() => onSelect(p.id)}
                  >
                    {isSelected ? "Viewing ✓" : "View"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}