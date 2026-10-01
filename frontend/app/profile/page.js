"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiFetch(
          "http://localhost:8000/auth/me"
        );

        if (!response.ok) {
          router.push("/login");
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Profile fetch error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 px-6 py-12 text-white md:px-10">
        <div className="mx-auto max-w-2xl animate-pulse space-y-6">
          <div className="h-8 w-40 rounded bg-gray-800" />
          <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-8 space-y-4">
            <div className="h-10 w-full rounded bg-gray-800/80" />
            <div className="h-10 w-full rounded bg-gray-800/80" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-900 px-6 py-12 text-white md:px-10">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-8 shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-blue-500/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {user.name}
                </h1>
                <p className="text-sm text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                user.role === "admin"
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              }`}
            >
              {user.role}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-gray-800/80 bg-gray-900/60 p-4">
              <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">
                Full Name
              </p>
              <p className="mt-1 text-base font-medium text-white">
                {user.name}
              </p>
            </div>

            <div className="rounded-xl border border-gray-800/80 bg-gray-900/60 p-4">
              <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">
                Email Address
              </p>
              <p className="mt-1 text-base font-medium text-white">
                {user.email}
              </p>
            </div>

            <div className="rounded-xl border border-gray-800/80 bg-gray-900/60 p-4">
              <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">
                Account ID
              </p>
              <p className="mt-1 text-base font-medium text-white">
                #{user.id}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 border-t border-gray-800/80 pt-6">
            <h2 className="text-xs uppercase font-semibold text-gray-400 tracking-wider mb-4">
              Quick Shortcuts
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/orders"
                className="rounded-xl border border-gray-800 bg-gray-900/80 p-3.5 text-center text-sm font-semibold text-gray-200 hover:bg-gray-800 transition"
              >
                View My Orders
              </Link>
              <Link
                href="/cart"
                className="rounded-xl border border-gray-800 bg-gray-900/80 p-3.5 text-center text-sm font-semibold text-gray-200 hover:bg-gray-800 transition"
              >
                Go to Cart
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="sm:col-span-2 rounded-xl border border-purple-500/30 bg-purple-950/20 p-3.5 text-center text-sm font-semibold text-purple-300 hover:bg-purple-900/30 transition"
                >
                  Go to Admin Dashboard →
                </Link>
              )}
            </div>

            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="mt-6 w-full rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/20 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}