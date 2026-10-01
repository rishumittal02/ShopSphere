"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/90 backdrop-blur-md px-6 py-4 md:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white group"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 font-black text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            S
          </span>
          <span>
            Shop<span className="text-blue-400">Sphere</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-300">
          <Link href="/" className="hover:text-white transition">
            Home
          </Link>
          <Link href="/products" className="hover:text-white transition">
            Products
          </Link>
          <Link href="/cart" className="hover:text-white transition flex items-center gap-1.5">
            <span>Cart</span>
          </Link>

          {user && (
            <Link href="/orders" className="hover:text-white transition">
              Orders
            </Link>
          )}

          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-lg bg-purple-500/10 px-3 py-1 font-semibold text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition"
            >
              Admin Panel
            </Link>
          )}

          <div className="h-4 w-px bg-gray-800 mx-1" />

          {loading ? (
            <span className="text-xs text-gray-500">Loading...</span>
          ) : user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:text-white transition"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span>{user.name}</span>
              </Link>
              <button
                onClick={logout}
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-3 py-1.5 hover:text-white transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-gray-950 hover:bg-gray-200 transition shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="rounded-xl border border-gray-800 bg-gray-900 p-2 text-gray-300 hover:text-white"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 border-t border-gray-800 pt-4 pb-2 space-y-3 text-sm font-medium text-gray-300">
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
            Products
          </Link>
          <Link
            href="/cart"
            onClick={closeMenu}
            className="block px-3 py-2 rounded-lg hover:bg-gray-900 hover:text-white"
          >
            Cart
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
    </nav>
  );
}