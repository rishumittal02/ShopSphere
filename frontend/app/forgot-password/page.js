"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../utils/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await apiFetch("http://localhost:8000/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Request failed");
      }

      setSuccess(
        data.message ||
          "If your email is registered with ShopSphere, password reset instructions have been dispatched to your inbox."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-md">
        {/* Simple Brand Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-3xl font-black tracking-tight text-white hover:text-blue-400 transition"
          >
            ShopSphere
          </Link>
          <p className="mt-1.5 text-xs text-gray-400">Account Recovery</p>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-900/80 p-8 shadow-2xl backdrop-blur-md">
          <h1 className="text-2xl font-black text-white tracking-tight">Forgot Password?</h1>
          <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
            Enter the email address associated with your ShopSphere account. We&apos;ll send you a secure link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500 transition"
                placeholder="name@example.com"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
                ⚠ {error}
              </p>
            )}

            {success && (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300 leading-relaxed">
                ✓ {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Sending Reset Link..." : "Send Password Reset Link"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-800/80 pt-4">
            Remembered your credentials?{" "}
            <Link href="/login" className="font-bold text-blue-400 hover:underline">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
