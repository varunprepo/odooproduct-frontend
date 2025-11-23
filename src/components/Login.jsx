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
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <h2 className="text-3xl mb-6 font-extrabold text-gray-800">Login</h2>
      
      {/* Message box for success/error instead of alert() */}
      <div id="message-box" className="h-6 mb-4 text-center"></div>

      {/* FORM CONTAINER STYLING
        - max-w-sm: Fixed width limit
        - p-8: Increased padding
        - bg-white: White background
        - shadow-2xl: Large, prominent shadow
        - rounded-xl: Consistent, large rounded corners for the 'card' effect
      */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm bg-white p-8 shadow-2xl rounded-xl">

        {/* INPUT STYLING
          - border: Adds border
          - border-black: Makes border black
          - rounded-lg: Consistent rounded corners
          - p-3: Increased padding
        */}
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
        
        {/* Forgot password link */}
        <div className="text-right mt-1">
          {/* NOTE: Link component is replaced by an anchor tag for single-file compatibility */}
          <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800 transition">
            Forgot Password?
          </Link>
        </div>

        {/* Buttons Container */}
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
            className="bg-green-600 text-white text-base px-5 py-2 rounded-lg hover:bg-green-700 transition shadow-md border border-black"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
