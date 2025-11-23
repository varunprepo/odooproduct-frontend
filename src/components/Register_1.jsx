import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      {/* await axios.post("http://127.0.0.1:3000/api/auth/register", form); */}
      await axios.post("http://localhost:3000/api/auth/register", form);
      //alert("Registration successful!");
      setStatus("✅ Registered. Check your email for activation instructions (if required).");
      setTimeout(() => navigate("/login"), 1500);
      //navigate("/login");
    } catch (err) {
      setStatus(err.response?.data?.message || "Registration failed");
      //alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="w-screen flex flex-col items-center mt-10 ">
      <h2 className="text-2xl mb-4 font-semibold">Register</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-80">
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="border p-2 rounded"
          required
        />
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
    className="bg-indigo-600 text-white text-sm px-2 py-1 rounded hover:bg-indigo-700 transition"
  >
    Register
  </button>
</div>
        {/* <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Register
        </button> */}
        {status && <p className="text-sm mt-2">{status}</p>}
      </form>
    </div>
  );
};

export default Register;
