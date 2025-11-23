import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
//import RequireAuth from "./RequireAuth"
import AuthLanding from "./components/AuthLanding";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Login from "./components/Login";
import NavBar from "./components/NavBar";
import OdooProductCardGenerator from "./components/OdooProductCardGenerator";
import WhatsAppMessageTemplate from "./components/WhatsAppMessageTemplate";

{/* const ProtectedPage = () => {
  const token = localStorage.getItem("token");
  return token ? (
    <>
      <NavBar />      	
      <div className="w-screen p-6 text-center text-xl">Welcome! You are logged in.</div>
      <OdooProductCardGenerator />
    </>
  ) : (
    <Navigate to="/login" />
  );
};        path="/odoo-product-card-generator"
 */}

function App() {

  /*const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/auth-landing", { replace: true });
    }
  }, [location, navigate]);*/

  const token = localStorage.getItem("token");
  return (
    <Router>
      <Routes>
        <Route path="/auth-landing" element={<AuthLanding />} />
        <Route
        path="/odoo-prod-cardgen"
        element={
            <OdooProductCardGenerator />
        }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/whatsapp-template" element={<WhatsAppMessageTemplate />} />
      </Routes>
    </Router>
  );
}

export default App;
