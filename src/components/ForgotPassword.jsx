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
<div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <h2 className="text-3xl mb-6 font-extrabold text-gray-800">Forgot Password</h2>
      
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
          type="email" 
          required 
          placeholder="Registered email" 
          value={email} 
          onChange={e=>setEmail(e.target.value)} 
          className="border border-black p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-150" 
        />
        
        {/* Helper Text */}
        <p className="text-sm text-gray-500 -mt-2">
            Enter your email to receive a password reset code.
        </p>

        <div className="flex justify-between items-center mt-3">
          
          {/* BUTTON STYLING
            - border-black: Black border
            - rounded-lg: Consistent rounded corners
            - px-5 py-2: Larger padding for better touch target size
          */}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="bg-gray-500 text-white text-base px-5 py-2 rounded-lg hover:bg-gray-600 transition shadow-md border border-black"
          >
            Back
          </button>

          <button
            type="submit"
            className="bg-green-600 text-white text-base px-5 py-2 rounded-lg hover:bg-green-700 transition shadow-md border border-black"
          >
            Send Activation Code
          </button>
        </div>
        
        {status && <p className="text-sm mt-4 text-center">{status}</p>}
      </form>
    </div>
  );
}
