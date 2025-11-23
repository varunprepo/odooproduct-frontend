import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const NavBar = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const closeTimeout = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");

    // Replace the current history state so forward button won't restore old pages
    navigate("/login", { replace: true });
    window.history.pushState(null, "", "/login");

    navigate("/login");

  };

  // Detect scroll for gradient fade
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent dropdown flicker / premature close
  const handleMouseEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => setIsDropdownOpen(false), 150);
  };

  return (
<nav
      className={`
        fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-3
        // Applied styling for a clear, defined block
        shadow-2xl border-b border-black transition-all duration-700 ease-in-out
        ${isScrolled ? "bg-indigo-700/90" : "bg-indigo-800"}
      `}
    >
      {/* Title / Logo - Replaced Settings icon with text/emoji */}
      <div 
        className="text-2xl font-extrabold cursor-pointer flex items-center"
        onClick={() => navigate("/odoo-prod-cardgen")}
      >
        <span className="text-3xl mr-2">⚙️</span>
        <span className="hidden sm:inline text-white">Card Generator</span>
      </div>

      {/* Right side: Dropdown and Logout */}
      <div className="flex items-center gap-4">
        
        {/* Settings Dropdown */}
        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            // Applied rounded-xl, black border, and shadow
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-500 transition border border-black shadow-lg"
          >
            Settings
            <span 
              className={`ml-2 w-4 h-4 transition-transform duration-300 ease-out ${
                isDropdownOpen ? "rotate-180" : "rotate-0"
              }`}
            >
              ▾
            </span>
          </button>

          {/* Dropdown Menu - Styled as a Card (Rounded corners, shadow, border) */}
          <div
            className={`
              absolute right-0 mt-1 w-64 // Use rounded-xl for consistency
              rounded-xl z-20 border border-black bg-white text-gray-900 p-2 shadow-2xl
              transform transition-all duration-300 ease-out origin-top
              ${
                isDropdownOpen
                  ? "opacity-100 scale-y-100 translate-y-1"
                  : "opacity-0 scale-y-0 -translate-y-2 pointer-events-none"
              }
            `}
          >
            <button
              onClick={() => {
                navigate("/whatsapp-template");
                setIsDropdownOpen(false);
              }}
              // Button inside dropdown uses rounded-lg for sub-card element
              className="block w-full text-left px-4 py-2 hover:bg-indigo-100 rounded-lg transition"
            >
              WhatsApp Message Template
            </button>
          </div>
        </div>

        {/* Username + Logout */}
        <div className="flex items-center gap-4">
          <span className="font-medium text-white hidden md:inline">Hello, {username}</span>
          <button
            onClick={handleLogout}
            // Applied rounded-xl, black border, and shadow
            className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition border border-black shadow-lg"
          >
            {/* Removed LogOut icon */}
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
