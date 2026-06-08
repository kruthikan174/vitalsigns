import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("role");
    const name  = localStorage.getItem("name");
    const userId = localStorage.getItem("user_id");
    if (token) setUser({ token, role, name, userId });
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);

    const res = await api.post("/api/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const { access_token, role, name, user_id } = res.data;
    localStorage.setItem("token",   access_token);
    localStorage.setItem("role",    role);
    localStorage.setItem("name",    name);
    localStorage.setItem("user_id", user_id);
    setUser({ token: access_token, role, name, userId: user_id });
    return role;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);