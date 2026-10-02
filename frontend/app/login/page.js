"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUnverified, setIsUnverified] = useState(false);


  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setIsUnverified(false);

      const body = new URLSearchParams();
      body.append("username", formData.email);
      body.append("password", formData.password);

      const response = await apiFetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 || (data.detail && data.detail.toLowerCase().includes("not verified"))) {
          setIsUnverified(true);
        }
        throw new Error(data.detail || "Login failed");
      }

      // Save token
      localStorage.setItem("access_token", data.access_token);

      if (login) {
        await login(data.access_token);
      }
      router.push("/");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-white relative">
      <div className="w-full max-w-md">
        {/* Simple Brand Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-3xl font-black tracking-tight text-white hover:text-blue-400 transition"
          >
            ShopSphere
          </Link>
          <p className="mt-1.5 text-xs text-gray-400">Welcome back! Sign in to continue</p>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-900/80 p-8 shadow-2xl backdrop-blur-md">
          <h1 className="text-2xl font-black text-white tracking-tight">Login</h1>
          <p className="mt-1 text-xs text-gray-400">Access your orders, saved addresses, and bag.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500 transition"
                placeholder="name@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-gray-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500 transition"
                placeholder="••••••••"
              />
            </div>

            {/* Error Banner */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
                <p>⚠ {error}</p>
                {isUnverified && (
                  <Link
                    href={`/register?email=${encodeURIComponent(formData.email)}&step=2`}
                    className="inline-block mt-2 font-bold text-blue-400 underline hover:text-blue-300"
                  >
                    Enter 6-Digit Email Verification Code →
                  </Link>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Verifying Credentials..." : "Sign In to ShopSphere"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400 border-t border-gray-800/80 pt-4">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-bold text-blue-400 hover:underline">
              Join Free Today
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}