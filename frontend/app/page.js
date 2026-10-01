"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          "http://localhost:8000/products/?limit=6&sort=name_asc"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch featured products");
        }

        const data = await response.json();
        setProducts(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="border-b border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-6 py-20 text-center md:px-12 md:py-28">
        <div className="mx-auto max-w-4xl">
          <span className="inline-block rounded-full bg-blue-600/10 px-4 py-1.5 text-sm font-medium text-blue-400 border border-blue-500/20">
            Next-Gen E-Commerce Platform
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-white">
            Modern Shopping, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              Seamlessly Delivered.
            </span>
          </h1>
          <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
            Discover a curated collection of premium products with fast checkout, instant inventory tracking, and complete order transparency.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/products"
              className="rounded-xl bg-white px-8 py-3.5 font-semibold text-gray-900 hover:bg-gray-100 transition shadow-lg shadow-white/10"
            >
              Explore Products
            </Link>
            <Link
              href="/cart"
              className="rounded-xl border border-gray-700 bg-gray-800/80 px-8 py-3.5 font-semibold text-gray-200 hover:bg-gray-800 transition"
            >
              View Cart
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white">
              Featured Products
            </h2>
            <p className="mt-1 text-gray-400">
              Hand-picked selections available for immediate delivery
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 group"
          >
            View all products
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-gray-800 bg-gray-800/50 p-6 space-y-4"
              >
                <div className="h-6 w-3/4 rounded bg-gray-700" />
                <div className="h-4 w-full rounded bg-gray-700/60" />
                <div className="h-4 w-1/2 rounded bg-gray-700/60" />
                <div className="h-8 w-1/3 rounded bg-gray-700 mt-6" />
                <div className="h-10 w-full rounded-xl bg-gray-700 mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-2xl border border-gray-800 bg-gray-800/40 p-12 text-center">
            <p className="text-xl text-gray-400">No products available at the moment.</p>
            <p className="mt-2 text-sm text-gray-500">Check back soon for new arrivals!</p>
          </div>
        )}

        {/* Product Grid */}
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
      </section>
    </main>
  );
}