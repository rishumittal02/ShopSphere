"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !user || user.role !== "admin") {
      return;
    }

    const fetchProducts = async () => {
      try {
        setError("");

        const response = await apiFetch(
          "http://localhost:8000/products/"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Failed to fetch products"
          );
        }

        setProducts(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, authLoading]);

  // DELETE PRODUCT
  const handleDelete = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await apiFetch(
        `http://localhost:8000/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to delete product"
        );
      }

      setProducts((previousProducts) =>
        previousProducts.filter(
          (product) => product.id !== productId
        )
      );
    } catch (error) {
      setError(error.message);
    }
  };

  if (authLoading || (loading && user?.role === "admin")) {
    return (
      <main className="min-h-screen bg-gray-900 p-10">
        <p className="text-center text-white">
          Loading products...
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
            Admin access is required.
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

  if (error) {
    return (
      <main className="min-h-screen bg-gray-900 p-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 p-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">
              Manage Products
            </h1>

            <p className="mt-2 text-gray-400">
              Add, update and delete products.
            </p>
          </div>

          <Link
            href="/admin/products/create"
            className="rounded-lg bg-white px-5 py-3 font-semibold text-black hover:bg-gray-200"
          >
            + Add Product
          </Link>
        </div>

        {/* PRODUCT TABLE */}
        <div className="mt-10 overflow-hidden rounded-xl bg-white shadow-lg">

          <table className="w-full">

            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-gray-700">
                  ID
                </th>

                <th className="px-6 py-4 text-left text-gray-700">
                  Product
                </th>

                <th className="px-6 py-4 text-left text-gray-700">
                  Price
                </th>

                <th className="px-6 py-4 text-left text-gray-700">
                  Stock
                </th>

                <th className="px-6 py-4 text-left text-gray-700">
                  Category
                </th>

                <th className="px-6 py-4 text-left text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>

              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-gray-200"
                  >

                    {/* ID */}
                    <td className="px-6 py-4 text-gray-900">
                      {product.id}
                    </td>

                    {/* PRODUCT */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {product.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {product.description}
                      </p>
                    </td>

                    {/* PRICE */}
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ₹{product.price}
                    </td>

                    {/* STOCK */}
                    <td className="px-6 py-4 text-gray-900">
                      {product.stock}
                    </td>

                    {/* CATEGORY */}
                    <td className="px-6 py-4 text-gray-900">
                      {product.category?.name}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">

                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() =>
                            handleDelete(product.id)
                          }
                          className="font-semibold text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </div>
    </main>
  );
}