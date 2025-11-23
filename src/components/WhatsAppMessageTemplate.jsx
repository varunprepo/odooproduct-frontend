import React, { useState, useEffect } from "react";
import axios from "axios";
import NavBar from "./NavBar";
import { useNavigate } from "react-router-dom";

const WhatsAppMessageTemplate = () => {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
   const handlePopState = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login", { replace: true });
   };

   window.addEventListener("popstate", handlePopState);

   return () => {
    window.removeEventListener("popstate", handlePopState);
   };
  }, [navigate]);

  // ✅ Fetch the existing template on mount
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        {/* const res = await axios.get("http://127.0.0.1:3000/api/template/latest"); */}
        const res = await axios.get("http://localhost:3000/api/template/latest", { withCredentials: true });
        if (res.data?.text) {
          setMessage(res.data.text);
        }
      } catch (err) {
        console.error("Fetch template error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
    	if (!message.trim()) {
      	    alert("Please enter a message template.");
      	    return;
    	}
        else {
            {/* await axios.post("http://127.0.0.1:3000/api/template/save", { text: message }); */}
            await axios.post("http://localhost:3000/api/template/save", { text: message, withCredentials: true });
            setStatus("✅ Template saved successfully!");
        }
    } catch (err) {
      setStatus("❌ Failed to save template",err.message);
    }
  };

  return (
    <>
      <NavBar />
      <div className="w-screen flex flex-col items-center mt-10">
        <h2 className="text-2xl mb-4 font-semibold">WhatsApp Message Template</h2>
        {isLoading ? (
          <p>Loading existing template...</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 w-96 bg-white p-6 rounded-lg shadow-lg border"
          >
            <textarea
              rows="6"
              placeholder="Type your WhatsApp message template here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border border-gray-300 rounded p-2 focus:ring focus:ring-blue-200 resize-none"
            />
<div className="flex justify-between items-center">
  <button
    type="button"
    onClick={() => navigate("/odoo-prod-cardgen")}
    className="bg-gray-500 text-white text-sm px-3 py-1 rounded hover:bg-gray-600 transition"
  >
    Back
  </button>

  <button
    type="submit"
    className="bg-green-600 text-white text-sm px-4 py-1 rounded hover:bg-green-700 transition"
  >
    Save / Update Template
  </button>
</div>
            {status && <p className="text-center text-sm mt-2">{status}</p>}
          </form>
        )}
      </div>
    </>
  );
};

export default WhatsAppMessageTemplate;
