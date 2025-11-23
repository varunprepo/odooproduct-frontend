// RequireAuth.jsx
import React from "react";
import { Navigate } from "react-router-dom";
{/* import { isTokenExpired } from "./utils/authUtils"; */}

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RequireAuth;
