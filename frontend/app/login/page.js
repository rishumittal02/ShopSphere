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

  // 3-4 Second Login State
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStepMessage, setAuthStepMessage] = useState("Authenticating credentials...");
  const [authProgress, setAuthProgress] = useState(15);

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

      // Begin 3.5-second smooth login transition
      setIsAuthenticating(true);
      setLoading(false);

      // Step 1 (0 - 1.2s)
      setAuthStepMessage("Validating security keys & user session...");
      setAuthProgress(35);

      // Step 2 (1.2s - 2.4s)
      setTimeout(() => {
        setAuthStepMessage("Loading your personalized cart & preferences...");
        setAuthProgress(70);
      }, 1200);

      // Step 3 (2.4s - 3.5s)
      setTimeout(() => {
        setAuthStepMessage("Authentication complete! Entering ShopSphere...");
        setAuthProgress(100);
      }, 2400);

      // Final Redirect at 3.5 seconds
      setTimeout(async () => {
        if (login) {
          await login(data.access_token);
        }
        router.push("/");
      }, 3500);
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
              disabled={loading || isAuthenticating}
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

      {/* 3-4 SECOND LOGIN PROGRESS OVERLAY */}
      {isAuthenticating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-blue-500/40 bg-gray-900 p-8 text-center shadow-2xl space-y-6">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-blue-600/20 border border-blue-500 flex items-center justify-center text-3xl animate-pulse">
              🛡️
            </div>

            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Logging You In</h3>
              <p className="mt-2 text-xs text-blue-400 font-semibold h-5 transition-all">
                {authStepMessage}
              </p>
            </div>

            {/* Progress Bar (3.5s transition) */}
            <div className="w-full bg-gray-950 rounded-full h-2.5 p-0.5 border border-gray-800 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${authProgress}%` }}
              />
            </div>

            <p className="text-[11px] text-gray-500">
              Securing connection with ShopSphere servers...
            </p>
          </div>
        </div>
      )}
    </main>
  );
}