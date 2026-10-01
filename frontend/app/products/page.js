"use client";

import { useEffect, useState } from "react";
import ProductCard from "../../components/ProductCard";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState("name_asc");

  const [page, setPage] = useState(1);
  const limit = 6;

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
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
          const response = await fetch(url);

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

  return (
    <main className="min-h-screen bg-gray-900 px-6 py-12 md:px-10 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            All Products
          </h1>
          <p className="mt-2 text-gray-400">
            Browse our complete catalog with realtime search and filters.
          </p>
        </div>

        {/* Filter Controls Bar (ALWAYS mounted) */}
        <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-5 shadow-lg backdrop-blur mb-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Search
              </label>
              <input
                id="search"
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or description..."
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Category
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              <label htmlFor="sort" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Sort By
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="name_asc">Name: A → Z</option>
                <option value="name_desc">Name: Z → A</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
              </select>
            </div>
          </div>

          {(search || categoryId || sort !== "name_asc") && (
            <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Active filters applied
              </span>
              <button
                onClick={handleClearFilters}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
            <p className="text-red-400 font-medium">{error}</p>
            <button
              onClick={() => setPage((p) => p)}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-4"
              >
                <div className="h-5 w-24 rounded bg-gray-800" />
                <div className="h-6 w-3/4 rounded bg-gray-800" />
                <div className="h-4 w-full rounded bg-gray-800/80" />
                <div className="h-4 w-2/3 rounded bg-gray-800/80" />
                <div className="h-8 w-1/3 rounded bg-gray-800 mt-6" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-2xl border border-gray-800 bg-gray-950/40 p-12 text-center my-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 mb-4 text-xl">
              🔍
            </div>
            <h3 className="text-lg font-bold text-white">No products found</h3>
            <p className="mt-1 text-sm text-gray-400">
              Try adjusting your search keywords or removing selected category filters.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-950 hover:bg-gray-200 transition"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                stock={product.stock}
                category={product.category?.name}
              />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && !error && (products.length > 0 || page > 1) && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-800 pt-6">
            <p className="text-sm text-gray-400">
              Showing page <span className="font-semibold text-white">{page}</span>
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={page === 1}
                className="rounded-xl border border-gray-800 bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 transition"
              >
                ← Previous
              </button>

              <span className="rounded-lg bg-gray-800/80 px-3 py-1.5 text-sm font-medium text-gray-300">
                {page}
              </span>

              <button
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={products.length < limit}
                className="rounded-xl border border-gray-800 bg-white px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}