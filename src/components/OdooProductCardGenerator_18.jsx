import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader, Clipboard, Download, ChevronLeft, ChevronRight, Settings, Search } from 'lucide-react';
import NavBar from "./NavBar";

const PRODUCTS_PER_PAGE = 10;
const MAX_PAGES = 5; // Max pages to display (10 records/page * 5 pages = 50 records max)
const API_URL = 'http://localhost:3000/api/auth/products';
const MIN_SEARCH_LENGTH = 3;

const sanitizeValue = (val) => (!val || val === "false" || val === false ? "" : val);

/**
 * ProductCard component (memoized for performance)
 */
const ProductCard = React.memo(({
  product,
  uniqueKey,
  copyWhatsAppText,
  downloadCardAsImage,
  lastCopiedId,
  html2canvasLoaded,
  isDownloadLoading,
  showToast,
  templateLines
}) => {
  const cardRef = useRef(null);
  const isCopied = lastCopiedId === uniqueKey;
  const isDownloading = isDownloadLoading === uniqueKey;
  const qtyAvailable = product.qty_available ?? 0;

  const sku = sanitizeValue(product.default_code);
  const description = sanitizeValue(product.description_sale);

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "QAR",
    minimumFractionDigits: 2,
  }).format(product.list_price ?? 0);

  const whatsappText = useMemo(() => {
    const prodValues = [
      `${sanitizeValue(product.name)}`,
      `${sku}`,
      `${formattedPrice}`,
      `${qtyAvailable > 0 ? `${qtyAvailable} in stock` : "Out of Stock"}`,
      `${description}`
    ];

    let baseText = '';
if (templateLines && templateLines.length > 0) {
      for (let i = 0; i < templateLines.length; i++) {
        if (i <= 4) {
          baseText += `${templateLines[i]}${prodValues[i]}\n`;
        } else {
          baseText += `${templateLines[i]}\n`;
        }
      }
    }
    return baseText;
  }, [product, sku, description, formattedPrice, qtyAvailable, templateLines]);

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

  const handleCopyText = useCallback(async () => {
    try {
      if (whatsappText !== '') {
        await navigator.clipboard.writeText(whatsappText);
        showToast("✅ Product details copied to clipboard!", "success");
      } else {
        showToast("⚠️ No content inside template. Create one from Settings first.", "warning");
      }
    } catch (err) {
      console.error("Text copy error:", err);
      showToast("❌ Failed to copy text to clipboard.", "error");
    }
  }, [whatsappText, showToast]);

  const handleDownloadClick = useCallback(() => {
    if (html2canvasLoaded && cardRef.current) {
      downloadCardAsImage(cardRef.current, uniqueKey, product.name);
    } else {
      showToast("Download failed. Please wait for the page to fully load.", "error");
    }
}, [html2canvasLoaded, downloadCardAsImage, uniqueKey, product.name, showToast]);

  return (
    <div className="flex flex-col h-full">
      <div ref={cardRef} className="bg-white p-4 flex flex-col justify-between h-full text-gray-900 leading-snug break-words border border-black rounded-lg shadow-md">
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
        </div>

        <div className="flex-grow">
          <h3 className="font-bold text-lg mb-1">{product.name}</h3>
          <p className="text-xl font-extrabold text-indigo-700 mb-2">{formattedPrice}</p>

          <div className="text-xs space-y-1">
            {sku && <p><strong>SKU:</strong> {sku}</p>}
            <p><strong>Available:</strong> <span className={`font-semibold ${qtyAvailable > 0 ? 'text-green-600' : 'text-red-600'}`}>{qtyAvailable} units</span></p>
          </div>

          {description && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs italic text-gray-500 line-clamp-2">{description}</p>
            </div>
          )}
        </div>
      </div>

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

        <button
          onClick={handleDownloadClick}
          className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors border-black shadow-md"
          disabled={isDownloading}
        >
          {isDownloading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

/**
 * Main application component
 */
export default function OdooProductCardGenerator() {
  const navigate = useNavigate();

  // --- State Variables ---
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Controlled input and active query:
  const [searchTermInput, setSearchTermInput] = useState(''); // what user sees/edits
  const [searchQuery, setSearchQuery] = useState(''); // active query used for fetch/filtering

  const [productType] = useState('all');
  const [minQty, setMinQty] = useState(0);
  const [maxQty, setMaxQty] = useState(999999);
  const [lastCopiedId, setLastCopiedId] = useState(null);
  const [isDownloadLoading, setIsDownloadLoading] = useState(null);
  const [html2canvasLoaded, setHtml2canvasLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState([]);
  const [templateLines, setTemplateLines] = useState([]);
  const [hasSearched, setHasSearched] = useState(false); // track whether user actively searched at least once

  // --- Utility Functions ---
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    const newToast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);
setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Load html2canvas readiness
  useEffect(() => {
    setHtml2canvasLoaded(true);
  }, []);

  // Fetch latest template (unchanged)
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/template/latest");
        const data = await res.json();
        if (data?.text) {
          const lines = data.text.split(/\r?\n/).filter((l) => l.trim() !== "");
          setTemplateLines(lines);
        }
      } catch (err) {
        console.error("Template fetch error:", err);
      }
    };
    fetchTemplate();
  }, []);

  // --- Search behavior ---
  // 1) Debounce auto-search when user types (optional)
  /*useEffect(() => {
    // If user clears input and has not searched before, do nothing (initial load)
    // If user has typed less than min length, we won't auto-trigger search (but still respect manual search)
    const trimmed = searchTermInput.trim();
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      // do not auto-update query
      return;
    }
    const id = setTimeout(() => {
      setSearchQuery(trimmed.toLowerCase());
      setHasSearched(true);
      setCurrentPage(1);
    }, 450);
    return () => clearTimeout(id);
  }, [searchTermInput]);*/

  // 2) Manual search (Enter key or Search button) - immediate
  const handleSearchSubmit = useCallback((value) => {
    const trimmed = (value || '').trim();
    if (trimmed.length === 0) {
      // explicit clear: treat as user action (clear results)
      setSearchQuery('');
      setHasSearched(true);
 setProducts([]);
      setCurrentPage(1);
      return;
    }
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      showToast(`Search term must be at least ${MIN_SEARCH_LENGTH} characters long.`, 'warning');
      // still mark as searched so UI messages show
      setHasSearched(true);
      return;
    }
    setSearchQuery(trimmed.toLowerCase());
    setHasSearched(true);
    setCurrentPage(1);
  }, [showToast]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit(searchTermInput);
    }
  }, [handleSearchSubmit, searchTermInput]);

  const handleSearchClick = useCallback(() => {
    handleSearchSubmit(searchTermInput);
  }, [handleSearchSubmit, searchTermInput]);

  // --- API Call: fetch products when searchQuery changes ---
  useEffect(() => {
    // If no active query (empty) — do not call API automatically.
    // We keep products [] when user hasn't searched. hasSearched controls UI message behavior.
    const term = (searchQuery || '').trim();
    if (term.length < MIN_SEARCH_LENGTH) {
      // If user has manually searched (hasSearched true) and cleared the term, we should clear products
      if (hasSearched) {
        setProducts([]);
      }
      return;
    }

    let cancelled = false;
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}?search=${encodeURIComponent(term)}`);
        const data = await response.json();
        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        if (!cancelled) {
setProducts([]);
          setError(err?.message || 'Fetch failed');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchProducts();
    return () => { cancelled = true; };
  }, [searchQuery, hasSearched]);

  // --- Filter + sort locally (quantity filter + safety) ---
  const filteredProducts = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    const list = products.filter(p => {
      const qty = p.qty_available ?? 0;
      if (qty < minQty || qty > maxQty) return false;

      // If we have an active search term, filter by name or sku locally as well
      if (q && q.length >= MIN_SEARCH_LENGTH) {
        const name = (p.name || '').toLowerCase();
        const sku = (p.default_code || '').toLowerCase();
        if (!name.includes(q) && !sku.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return list;
  }, [products, searchQuery, minQty, maxQty]);

  // --- Pagination ---
  const totalProducts = filteredProducts.length;
  const MAX_VISIBLE_PRODUCTS = MAX_PAGES * PRODUCTS_PER_PAGE;
  const limitedFilteredProducts = filteredProducts.slice(0, MAX_VISIBLE_PRODUCTS);
  const totalPages = Math.max(1, Math.ceil(limitedFilteredProducts.length / PRODUCTS_PER_PAGE));

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return limitedFilteredProducts.slice(startIndex, endIndex);
  }, [limitedFilteredProducts, currentPage]);

  // --- Quantity handlers ---
  const handleMinQtyChange = useCallback((e) => {
    const rawValue = parseInt(e.target.value);
    const validatedValue = Math.min(999999, Math.max(0, isNaN(rawValue) ? 0 : rawValue));
    setMinQty(validatedValue);
  }, []);

  const handleMaxQtyChange = useCallback((e) => {
 const rawValue = parseInt(e.target.value);
    if (isNaN(rawValue)) {
      setMaxQty(999999);
      return;
    }
    const validatedValue = Math.max(1, Math.min(999999, rawValue));
    setMaxQty(validatedValue);
  }, []);

  // increment/decrement for max (kept from previous)
  const incrementMaxQty = useCallback(() => setMaxQty(prev => Math.min(999999, prev + 1)), []);
  const decrementMaxQty = useCallback(() => setMaxQty(prev => Math.max(1, prev - 1)), []);

  // Sticky header
  const [isSticky, setIsSticky] = useState(false);

// Sticky header effect
useEffect(() => {
  const handleScroll = () => {
    const scrollTop = window.scrollY;
    setIsSticky(scrollTop > 100);
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

  // --- Clipboard copy handler (kept) ---
  const copyWhatsAppText = useCallback((text, id) => {
    setLastCopiedId(id);
    navigator.clipboard.writeText(text).then(() => {
      showToast("WhatsApp message copied!", 'success');
      setTimeout(() => setLastCopiedId(null), 1500);
    }).catch(err => {
      console.error('Copy failed:', err);
      showToast("Failed to copy text. Please try again.", 'error');
      setTimeout(() => setLastCopiedId(null), 1500);
    });
  }, [showToast]);

  // --- Download card as image (kept) ---
  const downloadCardAsImage = useCallback((cardElement, id, productName) => {
    setIsDownloadLoading(id);
    const fileName = `${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_card.png`;
    try {
      html2canvas(cardElement, {
        allowTaint: true,
        useCORS: true,
        scale: 2,
        logging: false
      }).then(canvas => {
        const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const link = document.createElement('a');
        link.download = fileName;
        link.href = image;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
showToast("Product card downloaded successfully!", 'success');
      }).catch(err => {
        console.error("Error during html2canvas render:", err);
        showToast("Error generating image. Check console for details.", 'error');
      }).finally(() => {
        setIsDownloadLoading(null);
      });
    } catch (e) {
      console.error("Download failure:", e);
      setIsDownloadLoading(null);
      showToast("Download failed. HTML2Canvas may not be loaded.", 'error');
    }
  }, [showToast]);

  // --- Render guards ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-100 p-8 pt-20">
        <Loader className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="mt-4 text-gray-700">Loading product data...</p>
      </div>
    );
  }

  if (error && filteredProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-100 p-8 pt-20">
        <p className="text-red-600 font-bold text-xl">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          Try Reloading
        </button>
      </div>
    );
  }

  // UI state flags
  const isSearchActive = (searchQuery || '').length >= MIN_SEARCH_LENGTH;
  const isFilterActive = minQty > 0 || maxQty < 999999;
  const showZeroResults = (isSearchActive || isFilterActive) && filteredProducts.length === 0;

  // Pagination display values
  const totalDisplayCount = limitedFilteredProducts.length;
  const currentMaxRecord = Math.min(currentPage * PRODUCTS_PER_PAGE, totalDisplayCount);
  const currentMinRecord = Math.min((currentPage - 1) * PRODUCTS_PER_PAGE + 1, currentMaxRecord);
  const displayMinRecord = (totalDisplayCount > 0 && currentMinRecord === 0) ? 1 : currentMinRecord;

  return (
    <div className="w-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-20 font-inter">
      <NavBar />
<div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-center text-indigo-700 dark:text-indigo-700 mb-6">
            Odoo Product Card Generator
          </h2>
        </div>

       {/* <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 overflow-y-visible"> */}

        {/* --- Controls Panel (Centered using max-w and mx-auto) --- */}
        {/* --- Sticky Controls Panel --- */}
        <div className={`sticky top-20 z-40 transition-all duration-300 ${
          isSticky 
            ? 'bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-xl border-b border-gray-200 dark:border-gray-700 py-4'
            : 'bg-transparent'
        }`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
              <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
                isSticky ? 'shadow-2xl scale-[0.98]' : ''
              }`}>
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-center">

                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Search by name or SKU (Min 3 characters)"
                  value={searchTermInput}
                  onChange={(e) => setSearchTermInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 w-full md:w-80 p-3 border border-gray-300 rounded-lg shadow-inner focus:ring-indigo-500 focus:border-indigo-500 transition"
                />

                <button
                  onClick={handleSearchClick}
                  disabled={isLoading}
                  className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center border border-black"
                  title="Search Products"
                >
                  {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>

                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Min Qty:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg shadow-inner">
                    <input
                      type="number"
                      min="0"
                      value={minQty}
                      onChange={handleMinQtyChange}
                      className="w-24 p-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Max Qty:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg shadow-inner">
                    <input
                      type="number"
                      min="1"
                      max="999999"
                      value={maxQty}
                      onChange={handleMaxQtyChange}
                      className="w-24 p-2 text-center border-x border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    />
                  </div>
                </div>

              </div>
            </div>
        </div>
       </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-8">
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center py-20">
              <Loader className="w-10 h-10 text-indigo-500 animate-spin" />
              <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Loading Products...</span>
            </div>
          ) : paginatedProducts.length > 0 ? (
            <>
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  uniqueKey={product.id}
                  product={product}
                  copyWhatsAppText={copyWhatsAppText}
                  downloadCardAsImage={downloadCardAsImage}
                  lastCopiedId={lastCopiedId}
                  html2canvasLoaded={html2canvasLoaded}
                  isDownloadLoading={isDownloadLoading}
                  showToast={showToast}
                  templateLines={templateLines}
                />
              ))}

              {totalPages > 1 && (
               <div className="col-span-full flex justify-center items-center space-x-4 mt-8 p-4 bg-white rounded-xl shadow-lg border border-gray-200">
                    <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 transition-colors border border-black shadow-md"
                    >
                    <ChevronLeft className="w-5 h-5" />
                    </button>

                    <span className="text-lg font-medium text-gray-800">
                    Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
                    </span>
                    <span className="text-sm text-gray-500 ml-4">
                    Showing {displayMinRecord} - {currentMaxRecord} of {totalDisplayCount} records
                    {totalProducts > MAX_VISIBLE_PRODUCTS && ` (Total available: ${totalProducts})`}
                    </span>

                    <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 transition-colors border border-black shadow-md"
                    >
                    <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

              )}
            </>
          ) : (
            <div className="col-span-full text-center py-10 text-gray-600 dark:text-gray-400">
              {/* initial page load: do not show message until user has searched at least once */}
              {!hasSearched ? (
                <div className="text-sm text-gray-400">Start by searching for products (min 3 characters).</div>
              ) : searchQuery.length >= MIN_SEARCH_LENGTH ? (
                <p className="text-xl font-semibold text-gray-500">No products found matching "{searchQuery}". Try a different term.</p>
              ) : searchQuery.length > 0 ? (
                <p className="text-xl font-semibold text-gray-500">Search term is too short (min {MIN_SEARCH_LENGTH} characters). Showing no results.</p>
              ) : (
                <p className="text-xl font-semibold text-gray-500">No products to display. Try searching or check your connection/API setup.</p>
              )}
            </div>
          )}
        </div>

        {/* --- Toast Notifications --- */}
        <div className="fixed bottom-6 right-6 flex flex-col space-y-2 z-50">
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 50, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 50, y: 20 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium pointer-events-auto border border-black ${
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
    </div>
  );
}
