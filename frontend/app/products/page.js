"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "../../components/ProductCard";
import { apiFetch } from "../../utils/api";

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("search") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(initialQuery);
  const [prevQuery, setPrevQuery] = useState(initialQuery);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState("name_asc");

  const [page, setPage] = useState(1);
  const limit = 12;

  // Sync state if URL search param changes without effect setState
  if (initialQuery !== prevQuery) {
    setPrevQuery(initialQuery);
    setSearch(initialQuery);
    setPage(1);
  }

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiFetch(
          "http://localhost:8000/categories/"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products with debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchProducts = async () => {
        try {
          setLoading(true);
          setError("");

          const params = new URLSearchParams();

          if (search.trim()) {
            params.append("search", search.trim());
          }

          if (categoryId) {
            params.append("category_id", categoryId);
          }

          if (sort) {
            params.append("sort", sort);
          }

          params.append("skip", (page - 1) * limit);
          params.append("limit", limit);

          const url = `http://localhost:8000/products/?${params.toString()}`;
          const response = await apiFetch(url);

          if (!response.ok) {
            throw new Error("Failed to fetch products");
          }

          const data = await response.json();
          setProducts(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchProducts();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [search, categoryId, sort, page]);

  const handleClearFilters = () => {
    setSearch("");
    setCategoryId("");
    setSort("name_asc");
    setPage(1);
  };

  const selectedCategoryName = categories.find((c) => String(c.id) === String(categoryId))?.name;

  return (
    <main className="min-h-screen bg-gray-950 px-4 sm:px-6 lg:px-10 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              {selectedCategoryName ? `Category: ${selectedCategoryName}` : "Explore Store"}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              All Products Catalog
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-400">
              Showing authentic products with verified pricing, fast shipping, and live stock updates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Found <strong className="text-white">{products.length}</strong> items
            </span>
          </div>
        </div>

        {/* Category Filter Pills (Instant 1-Click Filtering) */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => {
              setCategoryId("");
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              !categoryId
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "border border-gray-800 bg-gray-900 text-gray-400 hover:text-white hover:border-gray-700"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => {
            const isSelected = String(categoryId) === String(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoryId(isSelected ? "" : cat.id);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "border border-gray-800 bg-gray-900/90 text-gray-400 hover:text-white hover:border-gray-700"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Filter Controls Bar */}
        <div className="rounded-2xl border border-gray-800/80 bg-gray-900/50 p-4 sm:p-5 shadow-lg backdrop-blur-md mb-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                Keyword Search
              </label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by name, brand or specs..."
                  className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2 pl-9 text-xs sm:text-sm text-white placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                  🔍
                </span>
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Category Dropdown */}
            <div>
              <label htmlFor="category" className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                Filter by Category
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2 text-xs sm:text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sorting */}
            <div>
              <label htmlFor="sort" className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                Sort Pricing & Name
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-2 text-xs sm:text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="name_asc">Name: A → Z</option>
                <option value="name_desc">Name: Z → A</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
              </select>
            </div>
          </div>

          {(search || categoryId || sort !== "name_asc") && (
            <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
              <span className="text-gray-400">
                Filters active: {search && `"${search}" `} {selectedCategoryName && `[${selectedCategoryName}]`}
              </span>
              <button
                onClick={handleClearFilters}
                className="text-blue-400 hover:text-blue-300 font-semibold underline"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
            <p className="text-red-400 font-medium">{error}</p>
            <button
              onClick={() => setPage(1)}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-800/80 bg-gray-900/40 p-4 animate-pulse space-y-4"
              >
                <div className="aspect-[4/3] rounded-xl bg-gray-800/80" />
                <div className="h-4 w-3/4 rounded bg-gray-800" />
                <div className="h-3 w-full rounded bg-gray-800/60" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 w-1/3 rounded bg-gray-800" />
                  <div className="h-8 w-1/4 rounded-xl bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty Results State */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-12 text-center max-w-lg mx-auto">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-lg font-bold text-white">No products found</h3>
            <p className="mt-1.5 text-xs text-gray-400">
              We couldn&apos;t find any products matching your current filters. Try searching for something else or clearing your filters.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-5 rounded-full bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-md"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Product Cards Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                stock={product.stock}
                category={product.category?.name || "General"}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && products.length > 0 && (
          <div className="mt-12 flex items-center justify-center gap-3">
            <button
              disabled={page === 1}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-gray-700 hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-gray-900"
            >
              ← Previous
            </button>

            <span className="text-xs text-gray-400">
              Page <strong className="text-white">{page}</strong>
            </span>

            <button
              disabled={products.length < limit}
              onClick={() => {
                setPage((p) => p + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-gray-700 hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-gray-900"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 p-10 text-center text-gray-400">
        Loading catalog...
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}