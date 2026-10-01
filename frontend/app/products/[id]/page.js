"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || productId === "undefined") {
        setError("Invalid product ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await apiFetch(
          `http://localhost:8000/products/${productId}`
        );

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setAddingToCart(true);
      setFeedback({ type: "", message: "" });

      const response = await apiFetch(
        "http://localhost:8000/cart/items",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: product.id,
            quantity: quantity,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to add product to cart"
        );
      }

      setFeedback({
        type: "success",
        message: `Added ${quantity} item(s) to your cart!`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message,
      });
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 px-6 py-12 md:px-10 text-white">
        <div className="mx-auto max-w-4xl animate-pulse space-y-6">
          <div className="h-6 w-32 rounded bg-gray-800" />
          <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-8 space-y-6">
            <div className="h-8 w-2/3 rounded bg-gray-800" />
            <div className="h-4 w-full rounded bg-gray-800/80" />
            <div className="h-4 w-3/4 rounded bg-gray-800/80" />
            <div className="h-10 w-40 rounded bg-gray-800" />
            <div className="h-12 w-64 rounded bg-gray-800" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-gray-900 px-6 py-16 text-center text-white">
        <div className="mx-auto max-w-lg rounded-2xl border border-gray-800 bg-gray-950/80 p-10">
          <span className="text-4xl">📦</span>
          <h1 className="mt-4 text-2xl font-bold text-white">
            {error || "Product Not Found"}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            The product you are looking for may have been removed or does not exist.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-gray-950 hover:bg-gray-200 transition"
          >
            ← Back to Products
          </Link>
        </div>
      </main>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <main className="min-h-screen bg-gray-900 px-6 py-12 md:px-10 text-white">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-white transition">Products</Link>
          <span>/</span>
          <span className="text-gray-200 truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Card Container */}
        <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-8 shadow-2xl backdrop-blur">
          {/* Header & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-md bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300">
              {product.category?.name || "General"}
            </span>

            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                isOutOfStock
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : product.stock < 5
                  ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {isOutOfStock ? "Out of Stock" : `${product.stock} units in stock`}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4">
            <span className="text-xs text-gray-500 uppercase tracking-wider block">Price</span>
            <p className="text-3xl font-extrabold text-white">
              ₹{Number(product.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="mt-6 border-t border-gray-800/80 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Description
            </h2>
            <p className="mt-2 text-base leading-relaxed text-gray-300">
              {product.description || "No detailed description provided for this product."}
            </p>
          </div>

          {/* Feedback Banner */}
          {feedback.message && (
            <div
              className={`mt-6 rounded-xl p-4 text-sm font-medium flex items-center justify-between ${
                feedback.type === "success"
                  ? "border border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
                  : "border border-red-500/30 bg-red-950/30 text-red-300"
              }`}
            >
              <span>{feedback.message}</span>
              {feedback.type === "success" && (
                <Link
                  href="/cart"
                  className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-gray-950 hover:bg-emerald-400 transition"
                >
                  View Cart →
                </Link>
              )}
            </div>
          )}

          {/* Add to Cart Actions */}
          <div className="mt-8 border-t border-gray-800/80 pt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center rounded-xl border border-gray-800 bg-gray-900 p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={isOutOfStock || quantity <= 1}
                className="h-10 w-10 rounded-lg text-lg font-bold text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                −
              </button>

              <span className="w-12 text-center font-bold text-white">
                {isOutOfStock ? 0 : quantity}
              </span>

              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={isOutOfStock || quantity >= product.stock}
                className="h-10 w-10 rounded-lg text-lg font-bold text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                +
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || addingToCart}
              className="flex-1 rounded-xl bg-white px-8 py-3.5 font-bold text-gray-950 transition hover:bg-gray-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 shadow-lg shadow-white/10"
            >
              {isOutOfStock
                ? "Out of Stock"
                : addingToCart
                ? "Adding to Cart..."
                : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}