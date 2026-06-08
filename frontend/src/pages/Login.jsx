import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const role = await login(email, password);
      navigate(role === "clinician" ? "/clinician" : "/patient");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === "clinician") {
      setEmail("doctor@vitals.com");
      setPassword("doctor123");
    } else {
      setEmail("patient1@vitals.com");
      setPassword("patient123");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg)"
    }}>
      <div style={{ width: 380 }}>

        {/* logo / title */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "var(--primary)", margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26
          }}>❤️</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)" }}>
            VitalSigns
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 6 }}>
            Real-time health monitoring platform
          </p>
        </div>

        {/* card */}
        <div className="card">
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, color: "var(--muted)", fontSize: 13 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, color: "var(--muted)", fontSize: 13 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p style={{ color: "var(--irregular)", fontSize: 13 }}>{error}</p>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: 4, padding: "12px", fontSize: 15 }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* demo shortcuts */}
          <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 10, textAlign: "center" }}>
              Demo accounts
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn-ghost"
                style={{ flex: 1, fontSize: 13 }}
                onClick={() => fillDemo("clinician")}
                type="button"
              >
                👨‍⚕️ Clinician
              </button>
              <button
                className="btn-ghost"
                style={{ flex: 1, fontSize: 13 }}
                onClick={() => fillDemo("patient")}
                type="button"
              >
                🧑 Patient
              </button>
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 12, marginTop: 20 }}>
          VitalSigns © 2026 · IDP Project
        </p>
      </div>
    </div>
  );
}