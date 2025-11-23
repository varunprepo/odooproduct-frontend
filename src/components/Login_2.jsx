import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", form);
      {/*localStorage.setItem("token", res.data.token);
      localStorage.setItem("refreshToken", res.data.refreshToken);*/}
      localStorage.setItem("username", res.data.username);
      navigate("/odoo-prod-cardgen");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="w-screen flex flex-col items-center mt-10">
      <h2 className="text-2xl mb-4 font-semibold">Login</h2>
      {/* location.state?.sessionExpired && (
        <p className="text-red-500 mb-4">Session expired due to inactivity or token timeout.</p>
      ) */}     
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-64">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border p-2 rounded"
          required
        />
        {/* Forgot password link */}
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
            Forgot Password?
          </Link>
        </div>
<div className="flex justify-between items-center">
  <button
    type="button"
    onClick={() => navigate("/auth-landing")}
    className="bg-gray-500 text-white text-sm px-3 py-1 rounded hover:bg-gray-600 transition"
  >
    Back
  </button>

  <button
    type="submit"
    className="bg-green-600 text-white text-sm px-2 py-1 rounded hover:bg-green-700 transition"
  >
    Login
  </button>
</div>
        {/* <button className="bg-green-600 text-white py-2 rounded hover:bg-green-700">
          Login
        </button> */}
      </form>
    </div>
  );
};

export default Login;
