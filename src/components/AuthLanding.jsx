// AuthLanding.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function AuthLanding() {
  return (
<div className="min-h-screen w-screen flex items-center justify-center p-4 bg-gray-50">
      
      {/* CARD CONTAINER STYLING
        - max-w-sm: Fixed width limit
        - p-10: Increased padding
        - bg-white: White background
        - shadow-2xl: Large, prominent shadow
        - rounded-xl: Consistent, large rounded corners for the 'card' effect
      */}
      <div className="bg-white p-10 rounded-xl shadow-2xl text-center w-full max-w-sm">
        <h1 className="text-3xl font-extrabold mb-3 text-gray-800">Welcome</h1>
        <p className="mb-6 text-gray-600">
          Please choose an option to proceed with the Odoo Product Card Generator.
        </p>

        <div className="flex flex-col gap-4">
          
          {/* BUTTON STYLING
            - block: Full width
            - py-3 px-4: Larger padding for better touch target size
            - rounded-lg: Consistent rounded corners
            - shadow-md: Add shadow to button
            - border-black: Add black border for consistent design
          */}
          <Link to="/login" className="block py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md border border-black text-lg font-semibold">Login</Link>
          <Link to="/register" className="block py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md border border-black text-lg font-semibold">Register</Link>
        </div>
      </div>
    </div>
  );
}
