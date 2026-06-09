import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";

export default function Register() {
  const navigate = useNavigate();
  const [step,      setStep]      = useState(1); // step 1 = basic info, step 2 = patient details
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);

  const [form, setForm] = useState({
    name:      "",
    email:     "",
    password:  "",
    role:      "patient",
    age:       "",
    gender:    "",
    condition: "",
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleNext = (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("Please fill all fields");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (form.role === "patient") {
      setStep(2);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/register", {
        name:      form.name,
        email:     form.email,
        password:  form.password,
        role:      form.role,
        age:       form.age ? parseInt(form.age) : null,
        gender:    form.gender || null,
        condition: form.condition || null,
      });
      navigate("/", { state: { message: "Account created! Please log in." } });
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg)"
    }}>
      <div style={{ width: 400 }}>

        {/* logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "var(--primary)", margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26
          }}>❤️</div>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Create Account</h1>
          <p style={{ color: "var(--muted)", marginTop: 6 }}>
            {step === 1 ? "Step 1 of 2 — Basic info" : "Step 2 of 2 — Patient details"}
          </p>
        </div>

        <div className="card">

          {/* step indicators */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 999,
                background: s <= step ? "var(--primary)" : "var(--border)",
                transition: "background 0.3s"
              }} />
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={handleNext} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <div>
                <label style={{ display: "block", marginBottom: 6, color: "var(--muted)", fontSize: 13 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => update("name", e.target.value)}
                  placeholder="Dr. Jane Smith"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, color: "var(--muted)", fontSize: 13 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => update("email", e.target.value)}
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
                  value={form.password}
                  onChange={e => update("password", e.target.value)}
                  placeholder="Min 6 characters"
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, color: "var(--muted)", fontSize: 13 }}>
                  I am a...
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  {["clinician", "patient"].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => update("role", r)}
                      style={{
                        flex: 1, padding: "10px",
                        background: form.role === r ? "var(--primary)" : "var(--surface2)",
                        color: form.role === r ? "#fff" : "var(--muted)",
                        border: `1px solid ${form.role === r ? "var(--primary)" : "var(--border)"}`,
                        borderRadius: "var(--radius)",
                        fontSize: 14, fontWeight: 500,
                        textTransform: "capitalize"
                      }}
                    >
                      {r === "clinician" ? "👨‍⚕️ Clinician" : "🧑 Patient"}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p style={{ color: "var(--irregular)", fontSize: 13 }}>{error}</p>}

              <button type="submit" className="btn-primary" style={{ padding: "12px", fontSize: 15 }}>
                {form.role === "patient" ? "Next →" : "Create Account"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <div>
                <label style={{ display: "block", marginBottom: 6, color: "var(--muted)", fontSize: 13 }}>
                  Age
                </label>
                <input
                  type="number"
                  value={form.age}
                  onChange={e => update("age", e.target.value)}
                  placeholder="25"
                  min="1" max="120"
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, color: "var(--muted)", fontSize: 13 }}>
                  Gender
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Male", "Female", "Other"].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => update("gender", g)}
                      style={{
                        flex: 1, padding: "8px",
                        background: form.gender === g ? "var(--primary)" : "var(--surface2)",
                        color: form.gender === g ? "#fff" : "var(--muted)",
                        border: `1px solid ${form.gender === g ? "var(--primary)" : "var(--border)"}`,
                        borderRadius: "var(--radius)", fontSize: 13
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, color: "var(--muted)", fontSize: 13 }}>
                  Medical Condition (optional)
                </label>
                <input
                  type="text"
                  value={form.condition}
                  onChange={e => update("condition", e.target.value)}
                  placeholder="e.g. Hypertension, Anxiety, Normal"
                />
              </div>

              {error && <p style={{ color: "var(--irregular)", fontSize: 13 }}>{error}</p>}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ flex: 1, padding: "12px" }}
                  onClick={() => setStep(1)}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2, padding: "12px", fontSize: 15 }}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          )}

          {/* login link */}
          <p style={{ textAlign: "center", marginTop: 20, color: "var(--muted)", fontSize: 13 }}>
            Already have an account?{" "}
            <Link to="/" style={{ color: "var(--primary)", textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}