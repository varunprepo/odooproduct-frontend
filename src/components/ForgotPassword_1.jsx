// ForgotPassword.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/api/auth/request-reset", { email });
      setStatus("✅ Activation code sent to your email (check spam).");
      // optionally redirect to reset page
      setTimeout(() => navigate("/reset-password"), 1200);
    } catch (err) {
      setStatus(err.response?.data?.message || "Failed to send activation code");
    }
  };

  return (
    <div className="w-screen flex flex-col items-center mt-10">
      <h2 className="text-2xl mb-4 font-semibold">Forgot Password</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-80">
        <input type="email" required placeholder="Registered email" value={email} onChange={e=>setEmail(e.target.value)} className="border p-2 rounded" />
<div className="flex justify-between items-center">
  <button
    type="button"
    onClick={() => navigate("/login")}
    className="bg-gray-500 text-white text-sm px-3 py-1 rounded hover:bg-gray-600 transition"
  >
    Back
  </button>

  <button
    type="submit"
    className="bg-green-600 text-white text-sm px-2 py-1 rounded hover:bg-green-700 transition"
  >
    Send Activation Code
  </button>
</div>
        {status && <p className="text-sm mt-2">{status}</p>}
      </form>
    </div>
  );
}
