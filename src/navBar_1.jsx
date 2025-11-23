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
        shadow-md backdrop-blur-md transition-all duration-700 ease-in-out
        ${
          isScrolled
            ? "bg-gradient-to-b from-[#800000] to-[#4d0000] shadow-lg"
            : "bg-black/40"
        }
      `}
    >
      {/* App Title onClick={() => navigate("/")} */}
      <h1
        className="text-xl font-semibold text-white cursor-pointer"
      >
      </h1>

      <div className="flex items-center gap-8">
        {/* Settings Dropdown */}
        <div
          className="relative select-none"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Settings Button (light maroon + clickable toggle) */}
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="bg-red-500 text-black font-medium px-3 py-1 rounded flex items-center gap-1 hover:opacity-90 transition"
          >
            <span>Settings</span>
            <span
              className={`transform transition-transform duration-300 ease-out ${
                isDropdownOpen ? "rotate-180" : "rotate-0"
              }`}
            >
              ▾
            </span>
          </button>

          {/* Dropdown Menu (Animated + Blur + Shadow) */}
          <div
            className={`
              absolute right-0 mt-1 w-64 rounded-lg z-20 border border-gray-300 backdrop-blur-md
              transform transition-all duration-300 ease-out origin-top
              ${
                isDropdownOpen
                  ? "opacity-100 scale-y-100 translate-y-1 shadow-2xl"
                  : "opacity-0 scale-y-0 -translate-y-2 pointer-events-none"
              }
              bg-red-500/95 text-black
            `}
          >
            <button
              onClick={() => {
                navigate("/whatsapp-template");
                setIsDropdownOpen(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-[#d24c4c] hover:text-white rounded transition"
            >
              WhatsApp Message Template
            </button>
          </div>
        </div>

        {/* Username + Logout */}
        <div className="flex items-center gap-4">
          <span className="font-medium text-white">Hello, {username}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 px-4 py-1 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
