"use client";

import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 p-10">
        <p className="text-center text-white">
          Loading...
        </p>
      </main>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <main className="min-h-screen bg-gray-900 p-10">
        <div className="mx-auto max-w-3xl rounded-xl bg-gray-800 p-10 text-center">
          <h1 className="text-3xl font-bold text-white">
            Access Denied
          </h1>

          <p className="mt-3 text-gray-400">
            You do not have permission to access the admin dashboard.
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-white px-5 py-3 font-semibold text-black"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 p-10">
      <div className="mx-auto max-w-6xl">

        <div>
          <h1 className="text-4xl font-bold text-white">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-gray-400">
            Welcome, {user.name}
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">

          <Link
            href="/admin/products"
            className="rounded-xl bg-white p-8 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
          >
            <h2 className="text-2xl font-bold text-gray-900">
              Products
            </h2>

            <p className="mt-3 text-gray-600">
              Add, update and delete products.
            </p>
          </Link>

          <Link
            href="/admin/categories"
            className="rounded-xl bg-white p-8 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
          >
            <h2 className="text-2xl font-bold text-gray-900">
              Categories
            </h2>

            <p className="mt-3 text-gray-600">
              Manage product categories.
            </p>
          </Link>

          <Link
            href="/admin/orders"
            className="rounded-xl bg-white p-8 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
          >
            <h2 className="text-2xl font-bold text-gray-900">
              Orders
            </h2>

            <p className="mt-3 text-gray-600">
              View and manage customer orders.
            </p>
          </Link>

        </div>
      </div>
    </main>
  );
}