"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../utils/api";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Missing or invalid password reset token. Please request a new link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await apiFetch("http://localhost:8000/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          new_password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Password reset failed");
      }

      setSuccess("Your password has been reset successfully! Redirecting to login...");

      setTimeout(() => {
        router.push("/login?reset=success");
      }, 1500);
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
          <p className="mt-1.5 text-xs text-gray-400">Choose a New Password</p>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-900/80 p-8 shadow-2xl backdrop-blur-md">
          <h1 className="text-2xl font-black text-white tracking-tight">Reset Password</h1>
          <p className="mt-1.5 text-xs text-gray-400">
            Please enter your new password below.
          </p>

          {!token ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-xs text-red-300 space-y-3">
              <p>⚠ No password reset token found in link.</p>
              <Link
                href="/forgot-password"
                className="inline-block rounded-xl bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-500"
              >
                Request New Reset Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-gray-300">
                  New Password (min. 8 characters)
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500 transition"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold text-gray-300">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500 transition"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
                  ⚠ {error}
                </p>
              )}

              {success && (
                <p className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300">
                  ✓ {success}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Updating Password..." : "Update Password & Log In"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-800/80 pt-4">
            <Link href="/login" className="font-bold text-blue-400 hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 p-10 text-white">Loading reset page...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
