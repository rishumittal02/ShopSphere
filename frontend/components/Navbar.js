"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const closeMenu = () => setMobileMenuOpen(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      closeMenu();
    }
  };

  const categoriesNav = [
    { name: "All Products", href: "/products" },
    { name: "Electronics", href: "/products?search=Apple" },
    { name: "Gaming", href: "/products?search=Gaming" },
    { name: "Clothing", href: "/products?search=Jacket" },
    { name: "Footwear", href: "/products?search=Shoes" },
    { name: "Accessories", href: "/products?search=Smartwatch" },
    { name: "Home & Living", href: "/products?search=Coffee" },
  ];

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 px-4 py-1.5 text-center text-xs font-semibold text-white tracking-wide flex items-center justify-center gap-2">
        <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
          Limited Offer
        </span>
        <span>🎉 Mega Sale: Up to 40% OFF + Free Express Shipping across India!</span>
      </div>

      {/* Main Navbar */}
      <nav className="border-b border-gray-800 bg-gray-950/95 backdrop-blur-md px-4 sm:px-6 lg:px-10 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center gap-2 text-2xl font-black tracking-tight text-white group shrink-0"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 font-black text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-200">
              S
            </span>
            <span className="hidden sm:inline">
              Shop<span className="text-blue-400">Sphere</span>
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, sneakers, electronics..."
                className="w-full rounded-full border border-gray-800 bg-gray-900/90 px-4 py-2 pl-10 pr-10 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                🔍
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          {/* Desktop Right Nav */}
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-300">
            <Link href="/products" className="hover:text-blue-400 transition-colors">
              Explore
            </Link>

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="flex items-center gap-1.5 rounded-full border border-gray-800 bg-gray-900 px-3.5 py-1.5 text-xs font-bold text-white hover:border-gray-700 hover:bg-gray-800 transition active:scale-95 shadow-sm"
            >
              <span>🛒</span>
              <span>Cart</span>
            </Link>

            {user && (
              <Link href="/orders" className="hover:text-blue-400 transition-colors">
                Orders
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="rounded-lg bg-purple-500/10 px-3 py-1 font-semibold text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition"
              >
                Admin
              </Link>
            )}

            <div className="h-4 w-px bg-gray-800" />

            {loading ? (
              <span className="text-xs text-gray-500 animate-pulse">Loading...</span>
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 hover:text-white transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs max-w-[100px] truncate">{user.name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-gray-950 hover:bg-gray-200 transition shadow-sm active:scale-95"
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/cart"
              className="flex items-center gap-1 rounded-full border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-white"
            >
              <span>🛒</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="rounded-xl border border-gray-800 bg-gray-900 p-2 text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Sub-Navbar: Categories Quick Links */}
        <div className="mx-auto max-w-7xl mt-3 hidden md:flex items-center gap-2 overflow-x-auto text-xs text-gray-400 border-t border-gray-900 pt-2.5 scrollbar-none">
          <span className="font-bold text-gray-500 text-[11px] uppercase tracking-wider mr-1">
            Shop By:
          </span>
          {categoriesNav.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="rounded-lg px-2.5 py-1 font-medium hover:bg-gray-800/80 hover:text-white transition whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-800 bg-gray-950 p-4 space-y-3 text-sm font-medium text-gray-300">
          <form onSubmit={handleSearch} className="mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </form>

          <Link
            href="/"
            onClick={closeMenu}
            className="block px-3 py-2 rounded-lg hover:bg-gray-900 hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/products"
            onClick={closeMenu}
            className="block px-3 py-2 rounded-lg hover:bg-gray-900 hover:text-white"
          >
            All Products
          </Link>
          <Link
            href="/cart"
            onClick={closeMenu}
            className="block px-3 py-2 rounded-lg hover:bg-gray-900 hover:text-white"
          >
            Shopping Cart
          </Link>

          {user && (
            <Link
              href="/orders"
              onClick={closeMenu}
              className="block px-3 py-2 rounded-lg hover:bg-gray-900 hover:text-white"
            >
              My Orders
            </Link>
          )}

          {user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={closeMenu}
              className="block px-3 py-2 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20"
            >
              Admin Dashboard
            </Link>
          )}

          <div className="border-t border-gray-800 pt-3">
            {loading ? (
              <span className="block px-3 py-2 text-xs text-gray-500">Loading...</span>
            ) : user ? (
              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-lg hover:bg-gray-900 text-white font-semibold"
                >
                  Profile ({user.name})
                </Link>
                <button
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 font-semibold"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={closeMenu}
                  className="rounded-xl bg-white px-4 py-2.5 text-center text-sm font-bold text-gray-950"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}