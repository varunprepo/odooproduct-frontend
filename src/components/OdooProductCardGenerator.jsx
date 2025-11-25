// /mnt/data/OdooProductCardGenerator.jsx
// Patched: grouping by product name, image carousel with left/right arrows, swipe support (mobile)

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader, Clipboard, Download, ChevronLeft, ChevronRight, Settings, Search } from 'lucide-react';
import NavBar from "./NavBar";

const PRODUCTS_PER_PAGE = 10;
const MAX_PAGES = 5;
const API_URL = 'https://odooproductsbackend.vercel.app/api/auth/products';
const MIN_SEARCH_LENGTH = 3;

const sanitizeValue = (val) => (!val || val === "false" || val === false ? "" : val);

/* --------------------------------------------------------------------------
   PRODUCT CARD
-------------------------------------------------------------------------- */
const ProductCard = React.memo(({ 
  product,
  imageList = [],
  uniqueKey,
  copyWhatsAppText,
  downloadCardAsImage,
  html2canvasLoaded,
  isDownloadLoading,
  showToast,
  templateLines
}) => {
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
        if (i <= 4) baseText += `${templateLines[i]}${prodValues[i]}
`;
        else baseText += `${templateLines[i]}
`;
      }
    }
    return baseText;
  }, [product, sku, description, formattedPrice, qtyAvailable, templateLines]);

  const handleCopyImage = useCallback(async () => {
    if (!imageList || imageList.length === 0) {
      showToast("⚠️ No image available to copy.", "warning");
      return;
    }
    try {
      const blob = await (await fetch(`data:image/png;base64,${imageList[0]}`)).blob();
      if (navigator.clipboard?.write && window.ClipboardItem) {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        showToast("✅ Product image copied!", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to copy image.", "error");
    }
  }, [imageList, showToast]);

  const handleCopyText = useCallback(async () => {
    console.log('whatsappText:',whatsappText)
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

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Reset index when imageList changes
    setCurrentIndex(0);
  }, [imageList]);

  const showPrev = () => {
    if (!imageList || imageList.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };
  const showNext = () => {
    if (!imageList || imageList.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  };

  // Touch/swipe handlers
  const touchStartX = useRef(null);
  const touchCurrentX = useRef(null);
  const TOUCH_THRESHOLD = 40; // px

  const onTouchStart = (e) => {
    const t = e.touches && e.touches[0];
    if (t) touchStartX.current = t.clientX;
  };
  const onTouchMove = (e) => {
    const t = e.touches && e.touches[0];
    if (t) touchCurrentX.current = t.clientX;
  };
  const onTouchEnd = () => {
    if (touchStartX.current == null || touchCurrentX.current == null) {
      touchStartX.current = null;
      touchCurrentX.current = null;
      return;
    }
    const dx = touchCurrentX.current - touchStartX.current;
    if (Math.abs(dx) > TOUCH_THRESHOLD) {
      if (dx < 0) showNext();
      else showPrev();
    }
    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={cardRef} className="bg-white p-4 flex flex-col justify-between h-full text-gray-900 border border-black rounded-lg shadow-md">
        <div
          className="h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {imageList && imageList.length > 0 ? (
            <img
              src={`data:image/png;base64,${imageList[currentIndex]}`}
              alt={product.name}
              className="object-contain w-full h-full transition-all duration-300"
              draggable={false}
            />
          ) : (
            <span className="text-gray-400 font-semibold">No Image</span>
          )}

          {/* Left arrow */}
          {imageList && imageList.length > 1 && (
            <button
              onClick={showPrev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Right arrow */}
          {imageList && imageList.length > 1 && (
            <button
              onClick={showNext}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-2 rounded-full"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Indicator dots */}
          {imageList && imageList.length > 1 && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 flex space-x-1">
              {imageList.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-2 h-2 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/60'}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex-grow">
          <h3 className="font-bold text-lg mb-1">{product.name}</h3>
          <p className="text-xl font-extrabold text-indigo-700 mb-2">{formattedPrice}</p>

          <div className="text-xs space-y-1">
            {sku && <p><strong>SKU:</strong> {sku}</p>}
            <p>
              <strong>Available:</strong>{' '}
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
  const loaderRef = useRef(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [minQty, setMinQty] = useState(0);
  const [maxQty, setMaxQty] = useState(999999);
  const [isDownloadLoading, setIsDownloadLoading] = useState(null);
  const [html2canvasLoaded, setHtml2canvasLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState([]);
  const [templateLines, setTemplateLines] = useState([]);

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
        const res = await fetch("https://odooproductsbackend/api/template/latest");
        const data = await res.json();
        if (data?.text) {
          setTemplateLines(data.text.split(/\r?\n/).filter((l) => l.trim() !== ""));
        }
      } catch (err) { }
    };
    fetchTemplate();
  }, []);

  const fetchProducts = async (term, minQty, maxQty, page = 1, limit = 50) => {
    setIsLoading(true);
    try {
      let apiUrl = `${API_URL}?search=${encodeURIComponent(term)}`+
                   `&minQty=${encodeURIComponent(minQty)}` +
                   `&maxQty=${encodeURIComponent(maxQty)}` +
                   `&page=${encodeURIComponent(page)}` +
                   `&limit=${encodeURIComponent(limit)}`;

      //console.log('apiUrl is ',apiUrl)
      const response = await fetch(apiUrl);
      const data = await response.json();
      colsole.log('page no. :',page)
      colsole.log('json data :',data)
      if (page === 1) {
        setProducts(data);
      } else {
        setProducts((prev) => [...prev, ...data]);
      }

      if (data.length < limit) setHasMore(false);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = useCallback((
    val,
    freshMinQty,
    freshMaxQty,
    page = 1,
    limit = 50
  ) => {
    const trimmed = (val || "").trim();
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      showToast(`Minimum ${MIN_SEARCH_LENGTH} characters required.`, "warning");
      return;
    }

    fetchProducts(trimmed, freshMinQty, freshMaxQty, page, limit);
  }, [fetchProducts, showToast]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit(e.target.value, minQty, maxQty);
    }
  };

  const sortedProducts = [...products].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  );

  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return [...products].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [products, minQty, maxQty]);

  const limitedFilteredProducts = sortedProducts.slice(0, MAX_PAGES * PRODUCTS_PER_PAGE);
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

  useEffect(() => {
    if (searchText.trim().length < MIN_SEARCH_LENGTH) return;

    setPage(1);
    setHasMore(true);

    const delay = setTimeout(() => {
      handleSearchSubmit(searchText, minQty, maxQty, 1);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchText, minQty, maxQty]);

  useEffect(() => {
    if (searchText.trim().length >= MIN_SEARCH_LENGTH) {
      fetchProducts(searchText, minQty, maxQty, page);
    }
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  // --- GROUP PRODUCTS BY NAME (for carousel grouping) ---
  const groupedByName = {};
  paginatedProducts.forEach((p) => {
    const key = p.name || `__no_name_${p.id}`;
    if (!groupedByName[key]) groupedByName[key] = [];
    groupedByName[key].push(p);
  });
  const groupedProducts = Object.values(groupedByName);

  return (
    <div className="w-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-20 font-inter">
      <NavBar />

      {/* SCROLLABLE MAIN PANEL ------------------------------------------------ */}
      <div className="w-full max-h-[85vh] overflow-y-auto border-t border-gray-200">

        {/* STICKY SEARCH BAR ------------------------------------------------ */}
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-300 shadow-md">
          <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 items-center justify-center">

            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 w-full md:w-80 p-3 border border-gray-300 rounded-lg shadow-inner"
            />

            <button
              onClick={() => handleSearchSubmit(searchText, minQty, maxQty)}
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
            ) : groupedProducts.length > 0 ? (
              groupedProducts.map((group) => {
                const baseProduct = group[0];
                const imageList = group.map((p) => p.image_base64).filter(Boolean);

                return (
                  <ProductCard
                    key={`${baseProduct.id}_group`}
                    uniqueKey={`${baseProduct.id}_group`}
                    product={baseProduct}
                    imageList={imageList}
                    templateLines={templateLines}
                    copyWhatsAppText={() => {}}
                    downloadCardAsImage={downloadCardAsImage}
                    html2canvasLoaded={html2canvasLoaded}
                    isDownloadLoading={isDownloadLoading}
                    showToast={showToast}
                  />
                );
              })
            ) : (
              <div className="col-span-full text-center text-gray-500 py-10">
                No products found.
              </div>
            )}
          </div>

          <div ref={loaderRef} className="h-10"></div>
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
