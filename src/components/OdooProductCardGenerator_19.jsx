// OdooProductCardGenerator.jsx
// ---------- FULLY CORRECTED VERSION FOR INTERNAL STICKY PANEL ----------

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader, Clipboard, Download, ChevronLeft, ChevronRight, Settings, Search } from 'lucide-react';
import NavBar from "./NavBar";

const PRODUCTS_PER_PAGE = 10;
const MAX_PAGES = 5;
const API_URL = 'http://localhost:3000/api/auth/products';
const MIN_SEARCH_LENGTH = 3;

const sanitizeValue = (val) => (!val || val === "false" || val === false ? "" : val);

/* --------------------------------------------------------------------------
   PRODUCT CARD
-------------------------------------------------------------------------- */
const ProductCard = React.memo(({ product, uniqueKey, copyWhatsAppText, downloadCardAsImage, lastCopiedId, html2canvasLoaded, isDownloadLoading, showToast, templateLines }) => {
  const cardRef = useRef(null);
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
        if (i <= 4) baseText += `${templateLines[i]}${prodValues[i]}\n`;
        else baseText += `${templateLines[i]}\n`;
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
        showToast("✅ Product image copied!", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to copy image.", "error");
    }
  }, [product.image_base64, showToast]);

  const handleCopyText = useCallback(async () => {
    try {
      if (whatsappText !== '') {
        await navigator.clipboard.writeText(whatsappText);
        showToast("✅ Text copied!", "success");
      }
    } catch (err) {
      showToast("❌ Failed to copy text.", "error");
    }
  }, [whatsappText, showToast]);

  const handleDownloadClick = useCallback(() => {
    if (!html2canvasLoaded || !cardRef.current) {
      showToast("Page not fully loaded.", "error");
      return;
    }
    downloadCardAsImage(cardRef.current, uniqueKey, product.name);
  }, [html2canvasLoaded, downloadCardAsImage, uniqueKey, product.name, showToast]);

  return (
    <div className="flex flex-col h-full">
      <div ref={cardRef} className="bg-white p-4 flex flex-col justify-between h-full text-gray-900 border border-black rounded-lg shadow-md">
        <div className="h-48 bg-gray-200 flex items-center justify-center relative">
          {product.image_base64 ? (
            <img
              src={`data:image/png;base64,${product.image_base64}`}
              alt={product.name}
              className="object-contain w-full h-full"
            />
          ) : <span className="text-gray-400 font-semibold">No Image</span>}
        </div>

        <div className="flex-grow">
          <h3 className="font-bold text-lg mb-1">{product.name}</h3>
          <p className="text-xl font-extrabold text-indigo-700 mb-2">{formattedPrice}</p>

          <div className="text-xs space-y-1">
            {sku && <p><strong>SKU:</strong> {sku}</p>}
            <p>
              <strong>Available:</strong>{" "}
              <span className={`font-semibold ${qtyAvailable > 0 ? "text-green-600" : "text-red-600"}`}>
                {qtyAvailable} units
              </span>
            </p>
          </div>

          {description && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs italic text-gray-500 line-clamp-2">{description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto flex space-x-2">
        <button onClick={handleCopyImage} className="flex-1 p-2 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600">
          <Clipboard className="w-4 h-4 mr-1 inline" /> Image
        </button>

        <button onClick={handleCopyText} className="flex-1 p-2 text-sm rounded-lg bg-gray-700 text-white hover:bg-gray-800">
          <Clipboard className="w-4 h-4 mr-1 inline" /> Text
        </button>

        <button
          onClick={handleDownloadClick}
          disabled={isDownloading}
          className="px-4 py-2 text-sm rounded-lg text-white bg-red-600 hover:bg-red-700 border-black shadow-md"
        >
          {isDownloading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
});

/* --------------------------------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------------------------------- */
export default function OdooProductCardGenerator() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTermInput, setSearchTermInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minQty, setMinQty] = useState(0);
  const [maxQty, setMaxQty] = useState(999999);
  const [lastCopiedId, setLastCopiedId] = useState(null);
  const [isDownloadLoading, setIsDownloadLoading] = useState(null);
  const [html2canvasLoaded, setHtml2canvasLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState([]);
  const [templateLines, setTemplateLines] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  useEffect(() => setHtml2canvasLoaded(true), []);

  /* TEMPLATE FETCH */
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/template/latest");
        const data = await res.json();
        if (data?.text) {
          setTemplateLines(data.text.split(/\r?\n/).filter((l) => l.trim() !== ""));
        }
      } catch (err) { }
    };
    fetchTemplate();
  }, []);

  /* SEARCH SUBMIT */
  const handleSearchSubmit = useCallback((val) => {
    const trimmed = (val || "").trim();
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      showToast(`Minimum ${MIN_SEARCH_LENGTH} characters required.`, "warning");
      return;
    }
    let searchTerm = trimmed.toLowerCase()
    setSearchQuery(searchTerm);
    setHasSearched(true);
    setCurrentPage(1);
    // Call API
    fetchProducts(searchTerm);
  }, [showToast]);


  /* ENTER KEY */
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      //handleSearchSubmit(searchTermInput);
      handleSearchSubmit(e.target.value)
    }
  };

const fetchProducts = async (term) => {
  let cancelled = false;  // keep inside function
  setIsLoading(true);
  try {
    let apiUrl = `${API_URL}?search=${encodeURIComponent(term)}`
    console.log('apiUrl is ',apiUrl)
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (!cancelled) setProducts(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    if (!cancelled) setProducts([]);
  } finally {
    if (!cancelled) setIsLoading(false);
  }

  return () => { cancelled = true }; // optional cleanup if used in useEffect
};

  /* API FETCH ON ACTIVE SEARCH QUERY 
  useEffect(() => {
    if (searchQuery.length < MIN_SEARCH_LENGTH) return;

    fetchProducts();
    return () => (cancelled = true);
  }, [searchQuery]); */

  /* FILTER + SORT */
/*  const normalize = (str) =>
  (str || "")
    .toLowerCase()
    .normalize("NFKD")            // remove weird unicode forms
    .replace(/[^\w]+/g, " ")      // convert non-letters to spaces
    .replace(/\s+/g, " ")         // collapse multiple spaces
    .trim();

const filteredProducts = useMemo(() => {
  return products
    .filter((p) => {
      const qty = p.qty_available ?? 0;
      if (qty < minQty || qty > maxQty) return false;

      if (searchQuery.length >= MIN_SEARCH_LENGTH) {
        const name = normalize(p.name);
        const sku = normalize(p.default_code);
        const words = normalize(searchQuery).split(" ");

        const matchesAll = words.every(
          (w) => name.includes(w) || sku.includes(w)
        );

        if (!matchesAll) return false;
      }

      return true;
    })
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}, [products, searchQuery, minQty, maxQty]);*/

/*const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

useEffect(() => {
  const handler = setTimeout(() => setDebouncedQuery(searchQuery), 200);
  return () => clearTimeout(handler);
}, [searchQuery]);*/

const filteredProducts = useMemo(() => {
if (!products || products.length === 0) return [];

// normalize to lowercase letters only
  /*const normalize = (str) =>
    (str || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")      // accents
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width
      .replace(/[^a-z0-9]+/g, "")           // keep letters/numbers only
      .trim();

  // check if "abc" exists *in order* inside "a_x_b_y_c"
  const isSubsequence = (small, big) => {
    let i = 0, j = 0;
    while (i < small.length && j < big.length) {
      if (small[i] === big[j]) i++;
      j++;
    }
    return i === small.length;
  };

  //const queryNormalized = normalize(searchQuery);

  // Split debouncedQuery into words, normalize each
  const queryWords = searchQuery
    .split(/\s+/)
    .map((w) => normalize(w))
    .filter(Boolean);

  return products
    .filter((p) => {
      // Merge name + SKU into one normalized string
      const searchable = normalize(p.name) + normalize(p.default_code);

      // Optional: filter by quantity
      // const qty = p.qty_available ?? 0;
      // if (qty < minQty || qty > maxQty) return false;

      // Multi-word unordered subsequence matching:
      // Each search word must be a subsequence somewhere in the product
      return queryWords.every((word) => isSubsequence(word, searchable));

      // Check subsequence
      //return isSubsequence(queryNormalized, searchable);
  })*/
  return [...products].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  /*return products
    .filter((p) => {
      //const qty = p.qty_available ?? 0;
      //if (qty < minQty || qty > maxQty) return false;

      if (searchQuery.length >= MIN_SEARCH_LENGTH) {
        // collapse name & SKU into one letter-only string
        const nameSeq = lettersOnly(p.name);
        const skuSeq  = lettersOnly(p.default_code);
        const fullSeq = nameSeq + skuSeq;

        // search string collapsed to letters only
        const searchSeq = lettersOnly(searchQuery);

        // MUST be subsequence of full name
        const ok = isSubsequence(searchSeq, fullSeq);

        if (!ok) return false;
      }

      return true;
    })*/

}, [products, searchQuery]); //, minQty, maxQty]);

/*useEffect(() => {
  console.log("PRODUCTS AVAILABLE BEFORE FILTER:");
  products.forEach((p, i) => {
    console.log(i, p.name, p.default_code, p.qty_available);
  });
}, [products]);*/


/* const filteredProducts = useMemo(() => {
  // remove absolutely everything except a–z letters
  const lettersOnly = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .normalize("NFKD")                    
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")  // control chars
      .replace(/[\u200B-\u200F\u202A-\u202E]/g, "")  // zero-width, RTL/LTR
      .replace(/[\u0300-\u036f]/g, "")  // remove accents
      .replace(/[\u200B-\u200D\uFEFF]/g, "")  // remove zero-width chars
      .replace(/[^a-z]+/g, "")                       // keep ONLY letters
      .trim();
  };

  // check if "abc" exists *in order* inside "a_x_b_y_c"
  const isSubsequence = (small, big) => {
    let i = 0, j = 0;
    while (i < small.length && j < big.length) {
      if (small[i] === big[j]) i++;
      j++;
    }
    return i === small.length;
  };

  return products
    .filter((p) => {
 console.log("PRODUCT NAME RAW:", p.name, "QTY:", p.qty_available);

      const qty = p.qty_available ?? 0;
      if (qty < minQty || qty > maxQty) return false;

      if (!searchQuery || searchQuery.length === 0) return true; // if no search, include all

      // log searchQuery
      console.log("SEARCH QUERY:", searchQuery);

      // simple lowercase includes (temporary for debugging)
      const nameLower = (p.name || "").toLowerCase();
      const queryLower = searchQuery.toLowerCase();
      if (!nameLower.includes(queryLower)) return false;

      return true;
    })
    //.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

}, [products, searchQuery, minQty, maxQty]);*/

  /* PAGINATION */
  const limitedFilteredProducts = filteredProducts.slice(0, MAX_PAGES * PRODUCTS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(limitedFilteredProducts.length / PRODUCTS_PER_PAGE));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return limitedFilteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [limitedFilteredProducts, currentPage]);

  /* DOWNLOAD HANDLER */
  const downloadCardAsImage = useCallback((element, id, name) => {
    setIsDownloadLoading(id);
    const fileName = `${name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_card.png`;

    html2canvas(element, { scale: 2, useCORS: true }).then((canvas) => {
      const link = document.createElement("a");
      link.download = fileName;
      link.href = canvas.toDataURL("image/png");
      link.click();
      showToast("Downloaded!", "success");
    }).finally(() => setIsDownloadLoading(null));
  }, [showToast]);

  return (
    <div className="w-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-20 font-inter">
      <NavBar />

      {/* SCROLLABLE MAIN PANEL ------------------------------------------------ */}
      <div className="w-full max-h-[85vh] overflow-y-auto border-t border-gray-200">

        {/* STICKY SEARCH BAR ------------------------------------------------ */}
        <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-300 shadow-md">
          <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 items-center justify-center">

            <input
              type="text"
              placeholder="Search..."
              value={searchTermInput}
              onChange={(e) => setSearchTermInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 w-full md:w-80 p-3 border border-gray-300 rounded-lg shadow-inner"
            />

            <button
              onClick={() => handleSearchSubmit(searchTermInput)}
              disabled={isLoading}
              className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 border border-black"
            >
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>

            <div className="flex items-center space-x-2">
              <span>Min Qty:</span>
              <input
                type="number"
                min="0"
                value={minQty}
                onChange={(e) => setMinQty(Number(e.target.value))}
                className="w-24 p-2 text-center border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span>Max Qty:</span>
              <input
                type="number"
                min="1"
                max="999999"
                value={maxQty}
                onChange={(e) => setMaxQty(Number(e.target.value))}
                className="w-24 p-2 text-center border border-gray-300 rounded-lg"
              />
            </div>

          </div>
        </div>

        {/* PRODUCT GRID ------------------------------------------------ */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-20">
                <Loader className="w-10 h-10 text-indigo-500 animate-spin" />
              </div>
            ) : paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  uniqueKey={product.id}
                  product={product}
                  templateLines={templateLines}
                  copyWhatsAppText={() => {}}
                  downloadCardAsImage={downloadCardAsImage}
                  lastCopiedId={lastCopiedId}
                  html2canvasLoaded={html2canvasLoaded}
                  isDownloadLoading={isDownloadLoading}
                  showToast={showToast}
                />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-10">
                No products found.
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-10 p-4 bg-white rounded-xl shadow-lg border border-gray-200">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl border border-black"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-lg">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl border border-black"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* TOASTS ------------------------------------------------ */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-2 z-50">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm border border-black ${
                t.type === "success" ? "bg-green-600" :
                t.type === "warning" ? "bg-yellow-600" :
                t.type === "error" ? "bg-red-600" : "bg-gray-800"
              }`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
