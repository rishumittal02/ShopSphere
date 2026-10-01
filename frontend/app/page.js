"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "../components/ProductCard";
import { apiFetch } from "../utils/api";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiFetch(
          "http://localhost:8000/products/?limit=8&sort=name_asc"
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

  const categoryCards = [
    {
      name: "Electronics",
      desc: "Smartphones, Laptops & Audio",
      icon: "💻",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80",
      query: "electronics"
    },
    {
      name: "Gaming",
      desc: "Consoles, Headsets & Gear",
      icon: "🎮",
      image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80",
      query: "Gaming"
    },
    {
      name: "Clothing",
      desc: "Jackets, Hoodies & Shirts",
      icon: "👕",
      image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80",
      query: "Clothing"
    },
    {
      name: "Footwear",
      desc: "Sneakers, Boots & Runners",
      icon: "👟",
      image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80",
      query: "Footwear"
    },
    {
      name: "Accessories",
      desc: "Smartwatches, Bags & Shades",
      icon: "⌚",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
      query: "Accessories"
    },
    {
      name: "Home & Living",
      desc: "Coffee, Chairs & Purifiers",
      icon: "🏡",
      image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
      query: "Home & Living"
    }
  ];

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-800/80 bg-gradient-to-b from-gray-900 via-gray-950 to-gray-950 px-6 py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.18),rgba(255,255,255,0))]" />
        
        <div className="relative mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-400 mb-6 backdrop-blur-md">
            <span>✨ Premium Shopping Experience</span>
            <span className="h-1 w-1 rounded-full bg-blue-400" />
            <span className="text-gray-300">2026 Collection</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-6xl md:text-7xl bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            Upgrade Your Everyday. <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Shop With Confidence.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-gray-400 md:text-lg">
            Curated electronics, designer streetwear, high-performance gaming gear, and lifestyle essentials with fast pan-India delivery and guaranteed authentic products.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/products"
              className="rounded-full bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-500/25 transition duration-200 hover:bg-blue-500 active:scale-95"
            >
              Explore All Products →
            </Link>
            <Link
              href="/products?sort=price_desc"
              className="rounded-full border border-gray-800 bg-gray-900/80 px-8 py-3.5 text-sm font-semibold text-gray-200 backdrop-blur-sm transition duration-200 hover:border-gray-700 hover:bg-gray-800 active:scale-95"
            >
              View Best Deals
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-14 grid grid-cols-2 gap-4 border-t border-gray-800/80 pt-10 sm:grid-cols-4">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">30+ Products</p>
              <p className="text-xs text-gray-400 mt-1">Curated Catalog</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">6 Categories</p>
              <p className="text-xs text-gray-400 mt-1">From Tech to Fashion</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">4.9 / 5.0</p>
              <p className="text-xs text-gray-400 mt-1">Customer Satisfaction</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">100% Secure</p>
              <p className="text-xs text-gray-400 mt-1">Protected Payments</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-b border-gray-800 bg-gray-900/40 px-6 py-8">
        <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <span className="text-3xl">🚚</span>
            <div>
              <p className="text-sm font-bold text-white">Free Express Shipping</p>
              <p className="text-xs text-gray-400">On all orders above ₹999</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <span className="text-3xl">🛡️</span>
            <div>
              <p className="text-sm font-bold text-white">100% Genuine Brands</p>
              <p className="text-xs text-gray-400">Directly from verified partners</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <span className="text-3xl">🔄</span>
            <div>
              <p className="text-sm font-bold text-white">7-Day Free Returns</p>
              <p className="text-xs text-gray-400">No questions asked refund policy</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 justify-center md:justify-start">
            <span className="text-3xl">💳</span>
            <div>
              <p className="text-sm font-bold text-white">Secure Encrypted Orders</p>
              <p className="text-xs text-gray-400">Bank-grade checkout safety</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Showcase Grid */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Browse Catalog</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Shop by Category</h2>
          </div>
          <Link href="/products" className="text-xs sm:text-sm font-bold text-blue-400 hover:text-blue-300 transition">
            View All Categories →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categoryCards.map((cat) => (
            <Link
              key={cat.name}
              href={`/products?search=${encodeURIComponent(cat.query)}`}
              className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 aspect-[3/4] p-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
              
              <div className="relative z-10">
                <span className="text-2xl mb-1.5 block">{cat.icon}</span>
                <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:px-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Top Trending</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Featured Products</h2>
          </div>
          <Link href="/products" className="text-xs sm:text-sm font-bold text-blue-400 hover:text-blue-300 transition">
            See All ({products.length}) →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4 animate-pulse space-y-4"
              >
                <div className="aspect-[4/3] rounded-xl bg-gray-800/80" />
                <div className="h-4 w-3/4 rounded bg-gray-800" />
                <div className="h-3 w-full rounded bg-gray-800/60" />
                <div className="h-6 w-1/3 rounded bg-gray-800" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-400">
            <p className="font-bold">Failed to load featured products</p>
            <p className="text-xs mt-1 text-gray-400">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-12 text-center text-gray-400">
            <p className="text-lg font-bold text-white">No products found</p>
            <p className="text-sm mt-1">Check back soon for new arrivals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
      </section>

      {/* Promotional Banner */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 p-8 md:p-14">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 uppercase tracking-wider mb-4 border border-blue-500/30">
              Weekend Spotlight
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Upgrade Your Work & Gaming Setup Today.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-300 leading-relaxed">
              Explore the latest PlayStation 5 consoles, noise-cancelling headphones, and mechanical keyboards with instant EMI & warranty.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/products?search=Gaming"
                className="rounded-full bg-white px-7 py-3 text-xs font-bold text-gray-950 hover:bg-gray-200 transition shadow-lg active:scale-95"
              >
                Shop Gaming Gear
              </Link>
              <Link
                href="/products?search=Apple"
                className="rounded-full border border-white/20 bg-white/10 px-7 py-3 text-xs font-semibold text-white hover:bg-white/20 transition backdrop-blur-sm active:scale-95"
              >
                Browse Apple Deals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 bg-gray-950 px-6 py-12 md:px-10 text-xs text-gray-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 font-bold text-white text-xs">
              S
            </span>
            <span className="font-bold text-sm text-white">ShopSphere Inc.</span>
          </div>
          <p>© {new Date().getFullYear()} ShopSphere. All rights reserved. Built with Next.js, FastAPI & MySQL.</p>
          <div className="flex items-center gap-4 text-gray-400">
            <Link href="/products" className="hover:text-white transition">Products</Link>
            <Link href="/cart" className="hover:text-white transition">Cart</Link>
            <Link href="/orders" className="hover:text-white transition">Orders</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}