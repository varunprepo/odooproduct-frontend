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
      //await axios.post("http://localhost:3000/api/auth/register", form);
      await axios.post("https://odooproduct-backend.onrender.com:3000/api/auth/register", form);
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
<div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <h2 className="text-3xl mb-6 font-extrabold text-gray-800">Create Account</h2>
      
      {/* FORM CONTAINER STYLING
        - max-w-sm: Fixed width limit
        - p-8: Increased padding
        - bg-white: White background
        - shadow-2xl: Large, prominent shadow
        - rounded-xl: Consistent, large rounded corners for the 'card' effect
      */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm bg-white p-8 shadow-2xl rounded-xl">
        
        {/* INPUT STYLING
          - border-black: Black border
          - rounded-lg: Consistent rounded corners
          - p-3: Increased padding
        */}
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="border border-black p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border border-black p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border border-black p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
          required
        />

        <div className="flex justify-between items-center mt-3">
          
          {/* BUTTON STYLING
            - border-black: Black border
            - rounded-lg: Consistent rounded corners
            - px-5 py-2: Larger padding for better touch target size
          */}
          <button
            type="button"
            onClick={() => navigate("/auth-landing")}
            className="bg-gray-500 text-white text-base px-5 py-2 rounded-lg hover:bg-gray-600 transition shadow-md border border-black"
          >
            Back
          </button>

          <button
            type="submit"
            className="bg-indigo-600 text-white text-base px-5 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md border border-black"
          >
            Register
          </button>
        </div>
        
        {status && <p className="text-sm mt-4 text-center">{status}</p>}
      </form>
    </div>
  );
};

export default Register;
