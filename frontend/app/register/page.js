"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState(1); // 1 = register form, 2 = email verification
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await apiFetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      setSuccess("Account created! A 6-digit verification code has been dispatched to your email.");
      setStep(2);
      startResendTimer();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    if (!verificationCode.trim() || verificationCode.trim().length < 4) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await apiFetch("http://localhost:8000/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          code: verificationCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Verification failed");
      }

      setSuccess("Email verified successfully! Welcome to ShopSphere.");

      if (data.access_token) {
        if (login) {
          await login(data.access_token);
        } else {
          localStorage.setItem("access_token", data.access_token);
        }
      }

      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch("http://localhost:8000/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to resend code");
      }

      setSuccess("A new 6-digit verification code has been dispatched to your email.");
      startResendTimer();
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
          <p className="mt-1.5 text-xs text-gray-400">
            {step === 1 ? "Create your personal account" : "Email Verification"}
          </p>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-900/80 p-8 shadow-2xl backdrop-blur-md">
          {step === 1 ? (
            /* STEP 1: Registration Form */
            <>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Create Account
              </h1>
              <p className="mt-1 text-xs text-gray-400">
                Join ShopSphere for premier shopping, fast shipping & tracking.
              </p>

              <form onSubmit={handleRegister} className="mt-6 space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-gray-300">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500 transition"
                    placeholder="e.g. Rishu Mittal"
                  />
                </div>

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
                  <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-gray-300">
                    Password (min. 8 characters)
                  </label>
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
                  <p className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
                    ⚠ {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Creating Account..." : "Continue to Verification →"}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-blue-400 hover:underline">
                  Sign In
                </Link>
              </p>
            </>
          ) : (
            /* STEP 2: Verification Code Input */
            <>
              <div className="text-center mb-6">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-500/20 border border-blue-500 flex items-center justify-center text-xl mb-3">
                  ✉
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Verify Your Email
                </h1>
                <p className="mt-1 text-xs text-gray-400 leading-relaxed">
                  We sent a 6-digit confirmation code to{" "}
                  <strong className="text-white font-mono">{formData.email}</strong>.
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label htmlFor="code" className="mb-2 block text-xs font-semibold text-center text-gray-300 uppercase tracking-wider">
                    Enter 6-Digit Code
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    required
                    autoFocus
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold rounded-2xl border border-gray-700 bg-gray-950 px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-blue-500 transition"
                    placeholder="••••••"
                  />
                </div>

                {/* Error Banner */}
                {error && (
                  <p className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">
                    ⚠ {error}
                  </p>
                )}

                {/* Success Banner */}
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
                  {loading ? "Verifying..." : "Verify & Complete Registration"}
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-gray-400 hover:text-white cursor-pointer"
                  >
                    ← Change Email
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || loading}
                    className="text-blue-400 hover:text-blue-300 font-semibold disabled:text-gray-600 cursor-pointer"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}