"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";
import { getProductImage } from "../../../utils/productImages";

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Pagination State
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch all products and categories
  useEffect(() => {
    if (authLoading || !user || user.role !== "admin") {
      return;
    }

    const fetchData = async () => {
      try {
        setError("");
        setLoading(true);

        // Fetch products with high limit (500) so admin sees full inventory
        const [prodRes, catRes] = await Promise.all([
          apiFetch("http://localhost:8000/products/?limit=500"),
          apiFetch("http://localhost:8000/categories/")
        ]);

        const prodData = await prodRes.json();
        const catData = await catRes.json();

        if (!prodRes.ok) {
          throw new Error(prodData.detail || "Failed to fetch products");
        }

        setProducts(Array.isArray(prodData) ? prodData : []);
        setCategories(Array.isArray(catData) ? catData : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  // DELETE PRODUCT
  const handleDelete = async (productId, productName) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${productName}" (ID: ${productId})?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(productId);
      setError("");

      const response = await apiFetch(
        `http://localhost:8000/products/${productId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete product");
      }

      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      const matchesCat =
        selectedCategory === "all" ||
        String(p.category_id) === String(selectedCategory) ||
        (p.category?.name || "").toLowerCase() === selectedCategory.toLowerCase();

      // Search query filter
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.description || "").toLowerCase().includes(query) ||
        String(p.id).includes(query) ||
        (p.category?.name || "").toLowerCase().includes(query);

      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, pageSize]);

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: products.length };
    products.forEach((p) => {
      const catKey = p.category?.name?.toLowerCase() || "uncategorized";
      counts[catKey] = (counts[catKey] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Inventory stats
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stock > 0 && p.stock < 10).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= 0).length;
  }, [products]);

  if (authLoading || (loading && user?.role === "admin")) {
    return (
      <main className="min-h-screen bg-gray-950 p-6 sm:p-10 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-sm font-semibold text-gray-400">Loading catalog inventory...</p>
        </div>
      </main>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <main className="min-h-screen bg-gray-950 p-6 sm:p-10 flex items-center justify-center">
        <div className="mx-auto max-w-md rounded-3xl border border-red-500/20 bg-gray-900/60 p-8 text-center backdrop-blur-xl">
          <span className="text-4xl block mb-3">🔒</span>
          <h1 className="text-2xl font-black text-white">Access Restricted</h1>
          <p className="mt-2 text-sm text-gray-400">
            Administrator credentials are required to view the product management dashboard.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30"
          >
            ← Return to Storefront
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6 sm:p-10">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* TOP BREADCRUMB & HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
              <Link href="/" className="hover:underline">ShopSphere</Link>
              <span>/</span>
              <span>Admin Console</span>
              <span>/</span>
              <span className="text-gray-400">Product Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Manage Products Catalog
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Total {products.length} products available across {categories.length} active categories
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/categories"
              className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-xs font-semibold text-gray-300 hover:bg-gray-800 transition-all"
            >
              📁 Manage Categories
            </Link>
            <Link
              href="/admin/products/create"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition-all"
            >
              + Add New Product
            </Link>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-800/80 bg-gray-900/40 p-4">
            <p className="text-xs font-medium text-gray-400">Total Catalog Items</p>
            <p className="text-2xl font-black text-white mt-1">{products.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-800/80 bg-gray-900/40 p-4">
            <p className="text-xs font-medium text-gray-400">Categories</p>
            <p className="text-2xl font-black text-blue-400 mt-1">{categories.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-800/80 bg-gray-900/40 p-4">
            <p className="text-xs font-medium text-gray-400">Low Stock Alert (&lt;10)</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{lowStockCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-800/80 bg-gray-900/40 p-4">
            <p className="text-xs font-medium text-gray-400">Out of Stock</p>
            <p className={`text-2xl font-black mt-1 ${outOfStockCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {outOfStockCount}
            </p>
          </div>
        </div>

        {/* ERROR NOTIFICATION */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-medium text-red-300 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-white font-bold ml-4">✕</button>
          </div>
        )}

        {/* CONTROLS: CATEGORY TABS & SEARCH BAR */}
        <div className="space-y-3 rounded-3xl border border-gray-800/80 bg-gray-900/40 p-5 backdrop-blur-xl">
          {/* CATEGORY FILTER PILLS */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
              Filter by Category
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  selectedCategory === "all"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-gray-800/80 text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                All Products ({products.length})
              </button>

              {categories.map((cat) => {
                const count = categoryCounts[cat.name.toLowerCase()] || 0;
                const isSelected =
                  String(selectedCategory) === String(cat.id) ||
                  selectedCategory.toLowerCase() === cat.name.toLowerCase();

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                        : "bg-gray-800/80 text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* SEARCH & PAGE SIZE CONTROLS */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-gray-800/60">
            <div className="sm:col-span-8 relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search products by name, description, ID, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-800 bg-gray-950/80 py-2.5 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-3 flex items-center text-xs text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="sm:col-span-4 flex items-center justify-between sm:justify-end gap-3">
              <span className="text-xs text-gray-400">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-xl border border-gray-800 bg-gray-950 py-2 px-3 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                <option value={10}>10 items</option>
                <option value={20}>20 items</option>
                <option value={50}>50 items</option>
                <option value={100}>100 items</option>
              </select>
            </div>
          </div>
        </div>

        {/* PRODUCTS TABLE */}
        <div className="overflow-hidden rounded-3xl border border-gray-800/80 bg-gray-900/30 backdrop-blur-xl shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-800 bg-gray-900/80 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">ID</th>
                  <th className="py-3.5 px-4 w-16">Item</th>
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800/60">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500">
                      <div className="space-y-2">
                        <span className="text-3xl block">🔍</span>
                        <p className="font-semibold text-gray-300">No matching products found</p>
                        <p className="text-xs text-gray-500">
                          Try adjusting your category filter or search keywords
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => {
                    const imgSrc = getProductImage(product);
                    const isOutOfStock = product.stock <= 0;
                    const isLowStock = product.stock > 0 && product.stock < 10;

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-800/40 transition-colors group"
                      >
                        {/* ID */}
                        <td className="py-3.5 px-4 text-center font-mono text-gray-400">
                          #{product.id}
                        </td>

                        {/* PRODUCT THUMBNAIL */}
                        <td className="py-3.5 px-4">
                          <div className="h-12 w-12 rounded-xl overflow-hidden border border-gray-800 bg-gray-950 flex-shrink-0">
                            <img
                              src={imgSrc}
                              alt={product.name}
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        </td>

                        {/* PRODUCT INFO */}
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/products/${product.id}`}
                            className="font-bold text-white hover:text-blue-400 transition-colors block text-sm"
                          >
                            {product.name}
                          </Link>
                          <p className="text-gray-400 line-clamp-1 text-[11px] mt-0.5">
                            {product.description || "No description provided."}
                          </p>
                        </td>

                        {/* CATEGORY */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400">
                            {product.category?.name || "General"}
                          </span>
                        </td>

                        {/* PRICE */}
                        <td className="py-3.5 px-4 font-mono font-bold text-white text-sm">
                          ₹{Number(product.price).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>

                        {/* STOCK STATUS */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              isOutOfStock
                                ? "bg-red-500/10 text-red-400 border border-red-500/30"
                                : isLowStock
                                ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isOutOfStock
                                  ? "bg-red-500"
                                  : isLowStock
                                  ? "bg-amber-400 animate-pulse"
                                  : "bg-emerald-400"
                              }`}
                            />
                            {product.stock} in stock
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/products/edit/${product.id}`}
                              className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-1.5 text-[11px] font-semibold text-blue-400 hover:bg-gray-700 hover:text-white transition-all"
                            >
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDelete(product.id, product.name)}
                              disabled={deletingId === product.id}
                              className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500 hover:text-white transition-all disabled:opacity-40"
                            >
                              {deletingId === product.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="border-t border-gray-800/80 bg-gray-950/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-400">
              Showing{" "}
              <strong className="text-white">
                {totalItems === 0 ? 0 : startIndex + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-white">
                {Math.min(startIndex + pageSize, totalItems)}
              </strong>{" "}
              of <strong className="text-white">{totalItems}</strong> products
              {selectedCategory !== "all" && (
                <span> in <span className="text-blue-400 font-semibold">{selectedCategory}</span></span>
              )}
            </div>

            {/* PAGE NAVIGATION BUTTONS */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-xl border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ← Prev
              </button>

              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Only show current page, first, last, and immediate neighbors if totalPages > 5
                  if (
                    totalPages > 7 &&
                    page !== 1 &&
                    page !== totalPages &&
                    Math.abs(page - currentPage) > 1
                  ) {
                    if (page === 2 || page === totalPages - 1) {
                      return <span key={page} className="text-gray-600 text-xs px-1">...</span>;
                    }
                    return null;
                  }

                  const isActive = page === currentPage;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-xl border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}