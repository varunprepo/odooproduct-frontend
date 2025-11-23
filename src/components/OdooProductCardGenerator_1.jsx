import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader, Clipboard, Download, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import NavBar from "./NavBar";
import { isTokenExpired, getTokenRemainingTime } from "../utils/authUtils";
import { refreshAccessToken } from "../utils/refreshToken";

const PRODUCTS_PER_PAGE = 10;
const API_URL = 'http://localhost:3000/api/products';
const MIN_SEARCH_LENGTH = 3;

const sanitizeValue = (val) => (!val || val === "false" || val === false ? "" : val);

const ProductCard = React.memo(({ product, uniqueKey, copyWhatsAppText, downloadCardAsImage, lastCopiedId, html2canvasLoaded, isDownloadLoading, showToast, templateLines }) => {
  const cardRef = useRef(null);
  const isCopied = lastCopiedId === uniqueKey;
  const isDownloading = isDownloadLoading === uniqueKey;
  const qtyAvailable = product.qty_available ?? 0;

  const sku = sanitizeValue(product.default_code);
  const description = sanitizeValue(product.description_sale);

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(product.list_price || 0);

  const whatsappText = useMemo(() => {

    /*let baseText = `📦Product:${sanitizeValue(product.name)}\nSKU:${sku}\n💰Price:${formattedPrice}\n📊Stock:${
       qtyAvailable > 0 ? `${qtyAvailable} in stock` : "Out of Stock"
    }\n🧵Description:${description}\n`;*/
    let prodValues = new Array();
    prodValues[0] = `${sanitizeValue(product.name)}`;
    prodValues[1] = `${sku}`;
    prodValues[2] = `${formattedPrice.substring(1)}`;
    prodValues[3] = `${qtyAvailable > 0 ? `${qtyAvailable} in stock` : "Out of Stock"}`;
    prodValues[4] = `${description}`;
     
    let baseText = '';
    // ✅ Append each stored line dynamically
    if (templateLines && templateLines.length > 0) {
      for (let i = 0; i < templateLines.length; i++) {
          if(i<=4) {
              for (let j = i; j < i+1; j++) {
                  baseText += `${templateLines[i]}${prodValues[j]}\n`;
              }
          }
          else {
              baseText += `${templateLines[i]}\n`;
          }
      }
    }
    return baseText;

  }, [product, sku, description, formattedPrice, qtyAvailable, templateLines]);

  /*const handleCopy = useCallback(
    () => copyWhatsAppText(uniqueKey, whatsappText, product.image_base64),
    [copyWhatsAppText, uniqueKey, whatsappText, product.image_base64]
  );*/

  // Separate handlers for each button
    /* const handleCopyImage = useCallback(async () => {
      if (!product.image_base64) return alert("No image to copy!");
      try {
        const blob = await (await fetch(`data:image/png;base64,${product.image_base64}`)).blob();
        if (navigator.clipboard?.write && window.ClipboardItem) {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
          alert("✅ Product image copied to clipboard!");
        } else {
          alert("⚠️ Image clipboard not supported in this browser.");
        }
      } catch (err) {
        console.error("Error copying image:", err);
        alert("❌ Failed to copy image.");
      }
    }, [product.image_base64]);

    const handleCopyText = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(whatsappText);
        alert("✅ Product details copied to clipboard!");
      } catch (err) {
        console.error("Clipboard text copy failed:", err);
        alert("❌ Failed to copy text.");
      }
    }, [whatsappText]); */

// 🟢 Copy only image
    const handleCopyImage = useCallback(async () => {
      if (!product.image_base64) {
        showToast("⚠️ No image available to copy.", "warning");
        return;
      }

      try {
        const blob = await (await fetch(`data:image/png;base64,${product.image_base64}`)).blob();

        if (navigator.clipboard?.write && window.ClipboardItem) {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
          showToast("✅ Product image copied to clipboard!", "success");
        } else {
          showToast("⚠️ Image clipboard not supported on this browser.", "warning");
        }
      } catch (err) {
        console.error("Image copy error:", err);
        showToast("❌ Failed to copy image.", "error");
      }
    }, [product.image_base64, showToast]);

    // 🟢 Copy only text
    const handleCopyText = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(whatsappText);
        showToast("✅ Product details copied to clipboard!", "success");
      } catch (err) {
        console.error("Text copy error:", err);
        showToast("❌ Failed to copy text to clipboard.", "error");
      }
    }, [whatsappText, showToast]);

  const handleDownload = useCallback(() => {
    if (html2canvasLoaded) downloadCardAsImage(uniqueKey, cardRef.current, product.name);
  }, [downloadCardAsImage, uniqueKey, product.name, html2canvasLoaded]);

  return (
    <>
    <NavBar />
    <div ref={cardRef} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden animate-fadeIn">
      <div className="h-48 bg-gray-200 flex items-center justify-center relative">
        {product.image_base64 ? (
          <img
            src={`data:image/png;base64,${product.image_base64}`}
            alt={product.name}
            crossOrigin="anonymous" 
            referrerPolicy="no-referrer"
            className="object-contain w-full h-full"
          />
        ) : (
          <span className="text-gray-400 font-semibold">No Image</span>
        )}
        {/* <span className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-1 bg-gray-800 text-white rounded-lg opacity-80"> */}


      </div>

      <div className="p-5 flex flex-col flex-grow">
        {/* <h2 className="text-lg font-bold text-gray-900 mb-2 truncate">{sanitizeValue(product.name)}</h2> */}
        <h2 className="text-base font-semibold text-gray-900 mb-2 leading-tight break-words">{sanitizeValue(product.name)}</h2>
        <h2 className="text-base font-semibold text-xs text-black mb-2 leading-tight break-words">{sanitizeValue(sku)}</h2>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-extrabold text-indigo-600">{formattedPrice}</span>
{/* <span className="badge text-xs font-semibold px-2 py-1 bg-black-800 text-white rounded-lg opacity-80">
  {sku}
</span> */}
{/* <span
  className={`text-[12px] font-semibold grid place-items-center rounded-full px-4 h-[28px] ${
    qtyAvailable > 10
      ? 'bg-green-100 text-green-700'
      : qtyAvailable > 0
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700'
  }`}
  style={{
    lineHeight: '1',
    paddingTop: '1px',
  }}
>
  {qtyAvailable > 10
    ? `In Stock (${qtyAvailable})`
    : qtyAvailable > 0
    ? `Low Stock (${qtyAvailable})`
    : 'Out of Stock'}
</span> */}
        </div>
        <div className="flex items-center justify-between mb-4">
         <span
            className={`badge text-sm font-semibold px-3 py-1 rounded-full ${
              qtyAvailable > 10
                ? 'bg-green-100 text-green-700'
                : qtyAvailable > 0
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}
         >
            {qtyAvailable > 10
              ? `In Stock (${qtyAvailable})`
              : qtyAvailable > 0
              ? `Low Stock (${qtyAvailable})`
              : 'Out of Stock'}
         </span>
        </div> 
        <p className="text-sm text-gray-600 flex-grow mb-4 line-clamp-3">{description}</p>

        {/* Two clean buttons */}
          <div className="mt-auto flex space-x-2">
            <button
              onClick={handleCopyImage}
              className="no-capture flex-1 flex items-center justify-center p-2 text-sm font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
            >
              <Clipboard className="w-4 h-4 mr-1" /> Copy Image
            </button>

            <button
              onClick={handleCopyText}
              className="no-capture flex-1 flex items-center justify-center p-2 text-sm font-medium rounded-lg bg-gray-700 text-white hover:bg-gray-800 transition-colors"
            >
              <Clipboard className="w-4 h-4 mr-1" /> Copy Text Only
            </button>

        {/* <div className="mt-auto flex space-x-3">
          <button
            onClick={handleCopy}
            className={`no-capture flex-1 flex items-center justify-center p-3 text-sm font-medium rounded-lg transition-colors ${
              isCopied ? 'bg-green-500 text-white' : 'bg-indigo-500 text-white hover:bg-indigo-600'
            }`}
            disabled={isDownloading}
          >
            {isCopied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" /> Copied!
              </>
            ) : (
              <>
                <Clipboard className="w-4 h-4 mr-2" /> Copy WhatsApp
              </>
            )}
          </button> */}

          <button
            onClick={handleDownload}
            className="no-capture p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center min-w-[44px]"
            disabled={isDownloading}
          >
            {isDownloading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
    </>
  );
});

const OdooProductCardGenerator = () => {

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCopiedId, setLastCopiedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [html2canvasLoaded, setHtml2canvasLoaded] = useState(typeof html2canvas === 'function');
  const [isDownloadLoading, setIsDownloadLoading] = useState(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);
  const [templateLines, setTemplateLines] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60); // 60 seconds countdown
  const [noResults, setNoResults] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const currentProducts = products.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  const INACTIVITY_LIMIT = 2 * 60 * 1000; // 10 minutes in milliseconds
  const WARNING_TIME = 1 * 60 * 1000; // 1 minute before logout

  let inactivityTimer, warningTimer;

// 🔹 Detect login completion (token persisted)
useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    setTimeout(() => setSessionReady(true), 500);
  } else {
    setSessionReady(false);
  }
}, []);


  const logoutUser = useCallback(() => {
    console.warn("Logging out all tabs...");
    console.log("Token is:",localStorage.getItem("token"));
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.setItem("sessionStatus", "expired"); // 🔄 broadcast logout to all tabs
    navigate("/login", { replace: true });
    //window.history.pushState(null, "", "/login");
  }, [navigate]);

  // ✅ Token expiration check
  useEffect(() => {
    /*const token = localStorage.getItem("token");
    console.log("Inside useEff Token is:",localStorage.getItem("token"));
    if (!token || isTokenExpired(token)) {
      logoutUser();
      return;
    }*/
  if (!sessionReady) return; // ✅ Wait until login ready

  /*const timer = setTimeout(() => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      logoutUser();
    }
  }, 30000); // 1 second delay */

  const checkTokenValidity = () => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      logoutUser();
    }
  };

  // Check immediately and every 30 seconds
  checkTokenValidity();
  const interval = setInterval(checkTokenValidity, 30000);

  return () => clearInterval(interval);


  //return () => clearTimeout(timer);
  }, [sessionReady,logoutUser]);

  // ✅ Countdown for session expiry warning
  useEffect(() => {
    let countdownInterval;
    if (showWarning) {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            logoutUser();
            return 0;
          }
          return prev - 1;
        });
      }, 2000);
    } else {
      clearInterval(countdownInterval);
      setCountdown(60);
    }

    return () => clearInterval(countdownInterval);
  }, [showWarning, logoutUser]);

  // ✅ Inactivity detection + warning modal logic
  useEffect(() => {
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      setShowWarning(false);
      setCountdown(60);

      warningTimer = setTimeout(() => {
        console.warn(`User inactive for ${INACTIVITY_LIMIT/(60*1000)} minutes — showing warning...`);
        setShowWarning(true);
      }, INACTIVITY_LIMIT - WARNING_TIME);

      inactivityTimer = setTimeout(() => {
        console.warn(`User inactive for ${INACTIVITY_LIMIT/(60*1000)} minutes — logging out...`);
        logoutUser();
        }, INACTIVITY_LIMIT);
      };

    const events = ["mousemove", "mousedown", "keypress", "touchstart", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // start timers initially

    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [logoutUser]);

  // ✅ Handle Stay Signed In button
  const handleStaySignedIn = () => {
    const now = Date.now();
    localStorage.setItem("lastActivity", now.toString());
    setShowWarning(false);
    setCountdown(60);
    // Reset timers by simulating activity
    window.dispatchEvent(new Event("mousemove"));
  };

  // ✅ Token expiration check on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      logoutUser();
      return;
    }
  }, [logoutUser]);

  // ✅ Listen for session changes in other tabs
  useEffect(() => {
    const onStorageChange = (e) => {
      if (e.key === "sessionStatus" && e.newValue === "expired") {
        logoutUser();
      }
    };
    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, [logoutUser]);

  // ✅ Shared activity timer sync across tabs
  useEffect(() => {
    const updateActivity = () => {
      const now = Date.now();
      localStorage.setItem("lastActivity", now.toString());
    };
    const events = ["mousemove", "mousedown", "keypress", "touchstart", "scroll"];
    events.forEach((event) => window.addEventListener(event, updateActivity));

    // Initialize lastActivity if not present
    if (!localStorage.getItem("lastActivity")) updateActivity();

    return () => events.forEach((event) => window.removeEventListener(event, updateActivity));
  }, []);

  // ✅ Watch lastActivity across tabs + manage inactivity
  useEffect(() => {
    let inactivityCheckInterval;
    let warningShown = false;

    const checkInactivity = () => {
      const lastActivity = parseInt(localStorage.getItem("lastActivity") || "0", 10);
      const elapsed = Date.now() - lastActivity;

      if (elapsed >= INACTIVITY_LIMIT) {
        logoutUser();
      } else if (elapsed >= INACTIVITY_LIMIT - WARNING_TIME) {
        if (!warningShown) {
          warningShown = true;
          setShowWarning(true);
        }
      } else {
        warningShown = false;
        setShowWarning(false);
        setCountdown(60);
      }
    };

    inactivityCheckInterval = setInterval(checkInactivity, 1000);
    return () => clearInterval(inactivityCheckInterval);
  }, [logoutUser]);

  // ✅ Multi-tab logout listener
  useEffect(() => {
    const listener = (e) => {
      if (e.key === "sessionStatus" && e.newValue === "expired") logoutUser();
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, [logoutUser]);

  // ✅ Auto-refresh token if about to expire
  useEffect(() => {
    const scheduleRefresh = () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const remaining = getTokenRemainingTime(token);
      // refresh 1 minute before expiry
      const refreshTime = Math.max(remaining - 60 * 1000, 0);

      const timer = setTimeout(async () => {
        const refreshed = await refreshAccessToken();
        if (!refreshed) logoutUser();
        else scheduleRefresh(); // reschedule next refresh
      }, refreshTime);

      return () => clearTimeout(timer);
    };

    const cancel = scheduleRefresh();
    return cancel;
  }, [logoutUser]);


  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  {/* useEffect(() => {
    const interval = setInterval(async () => {
      const newToken = await refreshAccessToken();
      if (!newToken) console.warn("Session expired, logging out soon...");
    }, 2 * 60 * 1000); // refresh every 9 minutes for a 10-minute access token

    return () => clearInterval(interval);
  }, []); */}


  useEffect(() => {
    // ✅ Prevent forward navigation if not logged in
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }

    // ✅ Detect browser Back button
    const handlePopState = () => {
      // User clicked back — force logout and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      navigate("/login", { replace: true });
      window.history.pushState(null, "", "/login");
    };

    window.addEventListener("popstate", handlePopState);

    // ✅ Optional: Clean up listener
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  {/* useEffect(() => {
    // ✅ Listen for browser "Back" navigation
    const handleBackNavigation = () => {
      console.log("User pressed browser Back — logging out...");
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
      window.history.pushState(null, "", "/login");
      localStorage.removeItem("username");
      navigate("/login", { replace: true });
    };

    // Add listener for popstate (browser back/forward)
    window.addEventListener("popstate", handleBackNavigation);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("popstate", handleBackNavigation);
    };
  }, [navigate]); */}

  useEffect(() => {
    if (searchTerm.trim() === "") {
     setNoResults(false);
    }
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const fetchProducts = async () => {
      const term = debouncedSearchTerm.trim();
      {/*if (term.length < MIN_SEARCH_LENGTH) return setProducts([]);
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}?search=${encodeURIComponent(term)}`);
        const data = await response.json();
        setProducts(data);
        setCurrentPage(1);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();*/}
    if (term.length < MIN_SEARCH_LENGTH) {
      setProducts([]);
      setNoResults(false); // clear message when query is too short
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}?search=${encodeURIComponent(term)}`);
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
        setNoResults(false);
        setCurrentPage(1);
      } else {
        setProducts([]);
        setNoResults(true); // ✅ show "No records found" message
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setProducts([]);
      setNoResults(true);
    } finally {
      setIsLoading(false);
    }
  };
  fetchProducts();
  }, [debouncedSearchTerm]);

  useEffect(() => {
   const fetchTemplate = async () => {
     try {
      {/* const res = await fetch("http://127.0.0.1:3000/api/template/latest"); */}
      const res = await fetch("http://localhost:3000/api/template/latest");
      const data = await res.json();
      if (data?.text) {
        // Split text by line breaks
        const lines = data.text.split(/\r?\n/).filter((l) => l.trim() !== "");
        setTemplateLines(lines);
      }
     } catch (err) {
      console.error("Template fetch error:", err);
     }
    };
    fetchTemplate();
   }, []);

 {/* Client — Periodic Session Check in React */}
 useEffect(() => {

if (!sessionReady) return;

  const checkServerSession = async () => {
    const token = localStorage.getItem("token");
if (!token) {
  console.warn("No token yet, skipping verify-session");
  return;
}
    //if (!token) return;

    try {
      console.log("Checking session with token:", token);
      {/* const res = await fetch("http://127.0.0.1:3000/api/auth/verify-session", { headers: { Authorization: `Bearer ${token}`, valid: true|false }, */}
      const res = await fetch("http://localhost:3000/api/auth/verify-session", {
        headers: { Authorization: `Bearer ${token}`},
      });
      console.log("Verify-session response status:", res.status);
      const data = await res.json();
      console.log("Verify-session response body:", data);

      if (!data.valid) {
        console.warn("Server invalidated session — logging out all tabs.");
        localStorage.setItem("sessionStatus", "expired"); // broadcast logout
      }
    } catch (err) {
      console.error("Session verification failed:", err);
      // Optionally log out if server unreachable or token invalid
      // Don't logout immediately on network issues
      // localStorage.setItem("sessionStatus", "expired");
    }
  };

  // Run check every 2 minutes
  //const interval = setInterval(checkServerSession, 2 * 60 * 1000);
  // Also run immediately on mount
  //checkServerSession();
  //return () => clearInterval(interval);

const interval = setInterval(checkServerSession, 2 * 60 * 1000);

// Delay the first check slightly to let login complete and token persist
const timeout = setTimeout(checkServerSession, 2000);

return () => {
  clearInterval(interval);
  clearTimeout(timeout);
};

}, [sessionReady]);

   const downloadCardAsImage = useCallback(async (uniqueKey, element, productName) => {
    if (!element) return;
    setIsDownloadLoading(uniqueKey);
    try {
    /*  const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        ignoreElements: (el) => el.classList?.contains("no-capture"),
      });

    // 🟡 Step 1: adjust badges before capture
    const badges = element.querySelectorAll('.badge');
    const originalStyles = [];

    badges.forEach((badge) => {
      // store current inline style so we can revert later
      originalStyles.push({
        el: badge,
        display: badge.style.display,
        lineHeight: badge.style.lineHeight,
        paddingTop: badge.style.paddingTop,
        alignItems: badge.style.alignItems,
        justifyContent: badge.style.justifyContent,
      });

      // Apply pre-render fixes that html2canvas handles better
      badge.style.display = 'inline-block';
      badge.style.lineHeight = '1.2';
      badge.style.paddingTop = '2px';
      badge.style.alignItems = 'center';
      badge.style.justifyContent = 'center';
    });

// 🟢 Step 2: capture the image
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      ignoreElements: (el) => el.classList?.contains("no-capture"),
    });

    // 🟢 Step 3: revert temporary badge styles
    originalStyles.forEach((s) => {
      s.el.style.display = s.display;
      s.el.style.lineHeight = s.lineHeight;
      s.el.style.paddingTop = s.paddingTop;
      s.el.style.alignItems = s.alignItems;
      s.el.style.justifyContent = s.justifyContent;
    });*/

  const canvas = await html2canvas(element, {
  //scale: window.devicePixelRatio < 2 ? 2 : window.devicePixelRatio,
  //scale: window.devicePixelRatio || 2,
  scale: 2,
  backgroundColor: "#ffffff",
  useCORS: true,
  logging: false,
  //foreignObjectRendering: true,
  ignoreElements: (el) => {
    try {
      return (
        getComputedStyle(el).color.includes("oklch") ||
        el.classList?.contains("no-capture")
      );
    } catch {
      return false;
    }
  },
  onclone: (docClone) => {
    const badges = docClone.querySelectorAll(".badge");
    badges.forEach((b) => {
// Force consistent flex layout for perfect centering
  b.style.display = "flex";
  b.style.alignItems = "center";
  b.style.justifyContent = "center";
  b.style.flexDirection = "row";
  b.style.boxSizing = "border-box";

  // Pill shape and size
  b.style.height = "34px";              // ✅ fixed height
  b.style.lineHeight = "34px";          // ✅ matches height
  b.style.padding = "0 16px";           // pill width padding
  b.style.borderRadius = "9999px";      // fully rounded pill
  b.style.backgroundColor =
    window.getComputedStyle(b).backgroundColor || "#f3f3f3";

  // Text styling
  b.style.fontSize = "0.9rem";
  b.style.fontWeight = "600";
  b.style.whiteSpace = "nowrap";
  b.style.textAlign = "center";
  b.style.verticalAlign = "middle";
  b.style.overflow = "visible";
  b.style.color = window.getComputedStyle(b).color || "#000";

  // ✅ Subtle vertical correction for html2canvas baseline offset
  b.style.paddingBottom = "16px"; // gently nudges text upward for perfect centering

  // Remove transform & positioning artifacts
  b.style.transform = "none";
  b.style.position = "static";
  b.style.margin = "0";
      // Optionally add background/contrast fix if needed
      /*const bgColor = window.getComputedStyle(b).backgroundColor;
      if (!bgColor || bgColor === "transparent") {
        b.style.backgroundColor = "#f3f3f3";
      }*/

      // Fix overflow cutoff during render
      //b.style.overflow = "visible";
    });
  },
  /*onclone: (clonedDoc) => {
    clonedDoc.querySelectorAll("span").forEach((el) => {
      el.style.transform = "translateZ(0)";
    });
  },*/
});

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `product_card_${productName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`;
      link.click();

/*const blob = await domtoimage.toBlob(element, {
  quality: 1,
  bgcolor: "#ffffff"
});
const link = document.createElement("a");
link.href = URL.createObjectURL(blob);
//link.download = `product_card_${productName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`;
link.download = `product_card_${productName}.png`;
link.click();*/

    } catch (error) {
      console.error("Error generating card image:", error);
      showToast("Failed to generate image.", "error");
    } finally {
      setIsDownloadLoading(null);
    }
  }, [showToast]);

/* const downloadCardAsImage = useCallback(async (uniqueKey, element, productName) => {
  if (!element) return;
  setIsDownloadLoading(uniqueKey);

  try {
    const blob = await domtoimage.toPng(element, {
      quality: 1,
      bgcolor: "#ffffff",
      style: {
        transform: "scale(1)",
        transformOrigin: "top left",
      },
      filter: (node) => !node.classList?.contains("no-capture"),
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `product_card_${productName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`;
    link.click();
  } catch (error) {
    console.error("dom-to-image-more error:", error);
    showToast("Failed to generate image.", "error");
  } finally {
    setIsDownloadLoading(null);
  } */

/*const downloadCardAsImage = useCallback(async (uniqueKey, element, productName) => {
  if (!element) return;
  setIsDownloadLoading(uniqueKey);

  try {
    const dataUrl = await htmlToImage.toPng(element, {
      backgroundColor: "#ffffff",
      cacheBust: true,
      pixelRatio: 2,
      style: { transform: "none" },
      filter: (node) => !node.classList?.contains("no-capture"),
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `product_card_${productName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`;
    link.click();
  } catch (error) {
    console.error("html-to-image error:", error);
    showToast("⚠️ Failed to generate image.", "error");
  } finally {
    setIsDownloadLoading(null);
  }
}, [showToast]);*/

  /*try {
    // 🟡 1️⃣ Find badges and replace them with perfectly centered canvas versions
    const badges = Array.from(element.querySelectorAll(".badge"));
    const tempCanvases = [];

    for (const badge of badges) {
      const rect = badge.getBoundingClientRect();
      const canvas = document.createElement("canvas");
      const scale = window.devicePixelRatio || 2;
      const width = rect.width * scale;
      const height = rect.height * scale;
      canvas.width = width;
      canvas.height = height;
      canvas.style.position = "absolute";
      canvas.style.left = `${rect.left + window.scrollX}px`;
      canvas.style.top = `${rect.top + window.scrollY}px`;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      canvas.style.zIndex = "9999";

      // Draw rounded pill background and centered text
      const ctx = canvas.getContext("2d");
      ctx.scale(scale, scale);
      const radius = Math.min(rect.height / 2, 12);
      const bg = window.getComputedStyle(badge).backgroundColor;
      const color = window.getComputedStyle(badge).color;
      const text = badge.textContent.trim();

      // Rounded pill background
      ctx.fillStyle = bg || "#333";
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(rect.width - radius, 0);
      ctx.quadraticCurveTo(rect.width, 0, rect.width, radius);
      ctx.lineTo(rect.width, rect.height - radius);
      ctx.quadraticCurveTo(rect.width, rect.height, rect.width - radius, rect.height);
      ctx.lineTo(radius, rect.height);
      ctx.quadraticCurveTo(0, rect.height, 0, rect.height - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.fill();

      // Text
      ctx.fillStyle = color || "#fff";
      ctx.font = `${Math.round(rect.height * 0.5)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, rect.width / 2, rect.height / 2);

      document.body.appendChild(canvas);
      tempCanvases.push({ badge, canvas });
      badge.style.visibility = "hidden"; // hide original badge
    }

    // 🟢 2️⃣ Capture card as image
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      ignoreElements: (el) => el.classList?.contains("no-capture"),
    });

    // 🟣 3️⃣ Restore original DOM
    tempCanvases.forEach(({ badge, canvas }) => {
      badge.style.visibility = "";
      canvas.remove();
    });

    // 🟢 4️⃣ Trigger download
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `product_card_${productName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`;
    link.click();
  } catch (error) {
    console.error("Error generating card image:", error);
    showToast("Failed to generate image.", "error");
  } finally {
    setIsDownloadLoading(null);
  }
}, [showToast]);*/


  // ✅ Cross-browser clipboard with toast feedback
  const copyWhatsAppText = useCallback(async (id, text, imageBase64) => {
    let copiedImage = false;

    try {
      if (imageBase64 && window.ClipboardItem && navigator.clipboard?.write) {
        const blob = await (await fetch(`data:image/png;base64,${imageBase64}`)).blob();
        try {
          const clipboardItem = new ClipboardItem({
            "image/png": blob,
            "text/plain": new Blob([text], { type: "text/plain" }),
          });
          await navigator.clipboard.write([clipboardItem]);
          copiedImage = true;
        } catch {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            copiedImage = true;
          } catch {}
          await navigator.clipboard.writeText(text);
        }
      } else {
        await navigator.clipboard.writeText(text);
      }

      if (copiedImage) {
        showToast("✅ Product image & details copied!", "success");
      } else {
        showToast("⚠️ Only text copied (image clipboard unsupported).", "warning");
      }

      setLastCopiedId(id);
      setTimeout(() => setLastCopiedId(null), 2000);
    } catch (err) {
      console.error("Clipboard error:", err);
      try {
        await navigator.clipboard.writeText(text);
        showToast("⚠️ Only text copied; browser blocked image clipboard.", "warning");
      } catch {
        showToast("❌ Clipboard access failed — please allow permissions.", "error");
      }
    }
  }, [showToast]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim().length >= MIN_SEARCH_LENGTH) setDebouncedSearchTerm(searchTerm);
  };

  return (
    <>
    <NavBar />
    <div className="pt-16 sm:pt-20 md:pt-24 min-h-screen w-screen bg-gray-50 flex flex-col items-center overflow-x-hidden relative">
      {/* Header */}
      <header className="w-full bg-white shadow-md py-6 border-b-2 border-indigo-100">
        <div className="w-full max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-indigo-700 text-center">
            Odoo Product Card Generator
          </h1>
        </div>
      </header>

      {/* Search Bar */}
      <div className="w-full bg-white border-b border-gray-200">
        <form onSubmit={handleSearchSubmit} className="w-full max-w-7xl mx-auto p-5">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product (SKU, Barcode, or Name)..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
          />
          {/* <input type="button" onClick={refreshToken} value="Refresh" /> */}  
        </form>
      </div>

      {/* ✅ NEW SNIPPET — display message if no records found */}
      {noResults && (
          <p className="text-red-600 mt-2 text-sm font-medium text-center">
            No records found for the searched Odoo Product for Card Generation.
          </p>
      )}

      {/* Product Grid */}
      {!isLoading && currentProducts.length > 0 && (
        <>
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {currentProducts.map((product) => (
              <ProductCard
                key={`${product._id}-${product.default_code}`}
                product={product}
                uniqueKey={`${product._id}-${product.default_code}`}
                copyWhatsAppText={copyWhatsAppText}
                downloadCardAsImage={downloadCardAsImage}
                lastCopiedId={lastCopiedId}
                html2canvasLoaded={html2canvasLoaded}
                isDownloadLoading={isDownloadLoading}
                showToast={showToast}   // ✅ Add this prop
                templateLines={templateLines}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-6 mb-10">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-700 font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* 🟢 Animated Toast Container */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-2 z-50">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 50, y: 20 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium pointer-events-auto ${
                t.type === "success"
                  ? "bg-green-600"
                  : t.type === "warning"
                  ? "bg-yellow-600"
                  : t.type === "error"
                  ? "bg-red-600"
                  : "bg-gray-800"
              }`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
    {/* ⚠️ Session Expiry Warning Popup */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 text-center">
            <h2 className="text-lg font-semibold mb-3 text-red-600">
              ⚠️ Session Expiring Soon
            </h2>
            <p className="mb-3">
              You will be logged out in{" "}
              <span className="font-bold">{countdown}</span> seconds due to inactivity.
            </p>
            <button
              onClick={handleStaySignedIn}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
            >
              Stay Signed In
            </button>
          </div>
        </div>
      )}
   </>
  );
};

export default OdooProductCardGenerator;
