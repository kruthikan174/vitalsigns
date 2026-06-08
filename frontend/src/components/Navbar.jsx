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
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      padding: "0 24px",
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky", top: 0, zIndex: 100
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>❤️</span>
        <span style={{ fontWeight: 600, fontSize: 16 }}>VitalSigns</span>
        {title && (
          <>
            <span style={{ color: "var(--border)", margin: "0 4px" }}>/</span>
            <span style={{ color: "var(--muted)" }}>{title}</span>
          </>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>
          {user?.name} · <span style={{
            color: user?.role === "clinician" ? "var(--primary)" : "var(--normal)",
            textTransform: "capitalize"
          }}>{user?.role}</span>
        </span>
        <button className="btn-ghost" style={{ padding: "6px 14px" }} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}