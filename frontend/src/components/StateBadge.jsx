export default function StateBadge({ label, large }) {
  const colors = {
    Normal:    "var(--normal)",
    Stress:    "var(--stress)",
    Irregular: "var(--irregular)",
  };
  const icons = { Normal: "✅", Stress: "⚠️", Irregular: "🚨" };
  const color = colors[label] || "var(--muted)";

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: color + "22",
      border: `1px solid ${color}`,
      color: color,
      borderRadius: 999,
      padding: large ? "8px 20px" : "4px 12px",
      fontSize: large ? 16 : 13,
      fontWeight: 600,
    }}>
      {icons[label] || "❓"} {label || "Waiting..."}
    </span>
  );
}