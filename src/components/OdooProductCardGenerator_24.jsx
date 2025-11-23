import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader, Clipboard, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import NavBar from "./NavBar";

const PRODUCTS_PER_PAGE = 10;
const API_URL = 'http://localhost:3000/api/auth/products';
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
    const prodValues = [
      `${sanitizeValue(product.name)}`,
      `${sku}`,
      `${formattedPrice.substring(1)}`,
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

  const handleDownload = useCallback(() => {
    if (html2canvasLoaded) downloadCardAsImage(uniqueKey, cardRef.current, product.name);
  }, [downloadCardAsImage, uniqueKey, product.name, html2canvasLoaded]);

  return (
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
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h2 className="text-base font-semibold text-gray-900 mb-2 leading-tight break-words">{sanitizeValue(product.name)}</h2>
        <h2 className="text-xs font-semibold text-black mb-2 leading-tight break-words">{sanitizeValue(sku)}</h2>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-extrabold text-indigo-600">{formattedPrice}</span>
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
            onClick={handleDownload}
            className="no-capture p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center min-w-[44px]"
            disabled={isDownloading}
          >
            {isDownloading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
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
  const [noResults, setNoResults] = useState(false);

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const currentProducts = products.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const fetchProducts = async () => {
      const term = debouncedSearchTerm.trim();
      if (term.length < MIN_SEARCH_LENGTH) {
        setProducts([]);
        setNoResults(false);
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
          setNoResults(true);
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

  const downloadCardAsImage = useCallback(async (uniqueKey, element, productName) => {
    if (!element) return;
    setIsDownloadLoading(uniqueKey);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        ignoreElements: (el) => el.classList?.contains("no-capture"),
        onclone: (docClone) => {
          const badges = docClone.querySelectorAll(".badge");
          badges.forEach((b) => {
            b.style.display = "flex";
            b.style.alignItems = "center";
            b.style.justifyContent = "center";
            b.style.height = "34px";
            b.style.lineHeight = "34px";
            b.style.padding = "0 16px";
            b.style.borderRadius = "9999px";
            b.style.fontWeight = "600";
            b.style.fontSize = "0.9rem";
          });
        },
      });

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
  }, [showToast]);

  const copyWhatsAppText = useCallback(async (id, text, imageBase64) => {
    let copiedImage = false;
    try {
      if (imageBase64 && window.ClipboardItem && navigator.clipboard?.write) {
        const blob = await (await fetch(`data:image/png;base64,${imageBase64}`)).blob();
        const clipboardItem = new ClipboardItem({
          "image/png": blob,
          "text/plain": new Blob([text], { type: "text/plain" }),
        });
        await navigator.clipboard.write([clipboardItem]);
        copiedImage = true;
      } else {
        await navigator.clipboard.writeText(text);
      }
      showToast(copiedImage ? "✅ Product image & details copied!" : "⚠️ Only text copied.", "success");
      setLastCopiedId(id);
      setTimeout(() => setLastCopiedId(null), 2000);
    } catch (err) {
      console.error("Clipboard error:", err);
      showToast("❌ Clipboard access failed.", "error");
    }
  }, [showToast]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim().length >= MIN_SEARCH_LENGTH) setDebouncedSearchTerm(searchTerm);
  };

  return (
    <>
      <NavBar />
      <div className="pt-16 min-h-screen w-screen bg-gray-50 flex flex-col items-center overflow-x-hidden relative">
        <header className="w-full bg-white shadow-md py-6 border-b-2 border-indigo-100">
          <div className="w-full max-w-7xl mx-auto px-6">
            <h1 className="text-3xl font-bold text-indigo-700 text-center">
              Odoo Product Card Generator
            </h1>
          </div>
        </header>

        <div className="w-full bg-white border-b border-gray-200">
          <form onSubmit={handleSearchSubmit} className="w-full max-w-7xl mx-auto p-5">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product (SKU, Barcode, or Name)..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500"
            />
          </form>
        </div>

        {noResults && (
          <p className="text-red-600 mt-2 text-sm font-medium text-center">
            No records found for the searched Odoo Product.
          </p>
        )}

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
                  showToast={showToast}
                  templateLines={templateLines}
                />
              ))}
            </div>

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
    </>
  );
};

export default OdooProductCardGenerator;
