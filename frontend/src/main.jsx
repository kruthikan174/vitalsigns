import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import ClinicianDashboard from "./pages/ClinicianDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import "./index.css";

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={
        user
          ? <Navigate to={user.role === "clinician" ? "/clinician" : "/patient"} />
          : <Login />
      } />
      <Route path="/clinician" element={
        <ProtectedRoute allowedRole="clinician">
          <ClinicianDashboard />
        </ProtectedRoute>
      } />
      <Route path="/patient" element={
        <ProtectedRoute allowedRole="patient">
          <PatientDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);