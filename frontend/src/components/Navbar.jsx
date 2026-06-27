import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav style={{
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
      padding: "0 28px",
      height: 64,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 100
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          overflow: "hidden", flexShrink: 0,
          boxShadow: "0 2px 10px rgba(30,41,59,0.14)"
        }}>
          <img src="/heart_icon.png" alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" }}>VitalSigns</span>
        {title && (
          <>
            <span style={{ color: "#c7d0dd", margin: "0 2px" }}>/</span>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>{title}</span>
          </>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
            color: user?.role === "clinician" ? "var(--primary)" : "var(--normal)"
          }}>{user?.role}</div>
        </div>
        <button className="btn-ghost" style={{ padding: "8px 16px", fontSize: 13 }} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}