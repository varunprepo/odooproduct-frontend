// ResetPassword.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [form, setForm] = useState({ email: "", code: "", newPassword: "" });
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/auth/reset-password", form);
      setStatus("✅ Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1300);
    } catch (err) {
      setStatus(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="w-screen flex flex-col items-center mt-10">
      <h2 className="text-2xl mb-4 font-semibold">Reset Password</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-80">
        <input type="email" required placeholder="Registered email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="border p-2 rounded" />
        <input required placeholder="Activation code" value={form.code} onChange={e=>setForm({...form, code:e.target.value})} className="border p-2 rounded" />
        <input required type="password" placeholder="New password" value={form.newPassword} onChange={e=>setForm({...form, newPassword:e.target.value})} className="border p-2 rounded" />
<div className="flex justify-between items-center">
  <button
    type="button"
    onClick={() => navigate("/forgot-password")}
    className="bg-gray-500 text-white text-sm px-3 py-1 rounded hover:bg-gray-600 transition"
  >
    Back
  </button>

  <button
    type="submit"
    className="bg-green-600 text-white text-sm px-2 py-1 rounded hover:bg-green-700 transition"
  >
    Set New Password
  </button>
</div>
        {/* <button className="bg-green-600 text-white py-2 rounded hover:bg-green-700">Set New Password</button> */}
        {status && <p className="text-sm mt-2">{status}</p>}
      </form>
    </div>
  );
}
