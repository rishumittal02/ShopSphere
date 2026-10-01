"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../utils/api";

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        setError("");

        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

        if (!token) {
          router.push("/login");
          return;
        }

        const response = await apiFetch(
          "http://localhost:8000/cart/"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch cart");
        }

        const data = await response.json();
        setCart(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [router]);

  const checkout = async () => {
    if (checkingOut) return;

    try {
      setCheckingOut(true);
      setError("");

      const response = await apiFetch(
        "http://localhost:8000/orders/checkout",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Checkout failed"
        );
      }

      router.push("/orders");
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity <= 0) return;

    try {
      setUpdatingId(productId);
      setError("");

      const response = await apiFetch(
        `http://localhost:8000/cart/items/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: newQuantity,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to update quantity"
        );
      }

      setCart(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (productId) => {
    try {
      setUpdatingId(productId);
      setError("");

      const response = await apiFetch(
        `http://localhost:8000/cart/items/${productId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to remove item"
        );
      }

      setCart(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const clearCart = async () => {
    const confirmed = window.confirm("Are you sure you want to clear your entire cart?");
    if (!confirmed) return;

    try {
      setError("");

      const response = await apiFetch(
        "http://localhost:8000/cart/",
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to clear cart"
        );
      }

      setCart((currentCart) => ({
        ...currentCart,
        items: [],
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 px-6 py-12 text-white md:px-10">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-800" />
          <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-8 space-y-4">
            <div className="h-16 w-full rounded-xl bg-gray-800/80" />
            <div className="h-16 w-full rounded-xl bg-gray-800/80" />
          </div>
        </div>
      </main>
    );
  }

  const items = cart?.items || [];
  const subtotal = items.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-gray-900 px-6 py-12 text-white md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Shopping Cart
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {items.length === 1 ? "1 item in your cart" : `${items.length} items in your cart`}
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-800/80 flex items-center justify-center text-3xl mb-4">
              🛒
            </div>
            <h2 className="text-xl font-bold text-white">Your cart is currently empty</h2>
            <p className="mt-2 text-sm text-gray-400">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-950 hover:bg-gray-200 transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-gray-800 bg-gray-950/80 p-6 backdrop-blur"
                >
                  <div className="flex-1">
                    <Link
                      href={`/products/${item.product_id}`}
                      className="text-lg font-bold text-white hover:text-blue-400 transition"
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-1 text-sm text-gray-400">
                      ₹{Number(item.product.price).toFixed(2)} each
                    </p>

                    {/* Quantity controls */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-gray-800 bg-gray-900 p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updatingId === item.product_id}
                          className="h-8 w-8 rounded text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          −
                        </button>
                        <span className="w-10 text-center text-sm font-semibold text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={updatingId === item.product_id}
                          className="h-8 w-8 rounded text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.product_id)}
                        disabled={updatingId === item.product_id}
                        className="text-xs font-medium text-red-400 hover:text-red-300 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="text-right sm:self-center">
                    <span className="text-xs text-gray-500 block">Subtotal</span>
                    <p className="text-xl font-extrabold text-white">
                      ₹{(Number(item.product.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-6 backdrop-blur sticky top-6">
                <h2 className="text-xl font-bold text-white">Order Summary</h2>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span className="font-semibold text-white">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Standard Shipping</span>
                    <span className="font-semibold text-emerald-400">FREE</span>
                  </div>
                </div>

                <div className="my-5 border-t border-gray-800" />

                <div className="flex justify-between items-baseline">
                  <span className="text-base font-medium text-white">Total</span>
                  <span className="text-2xl font-extrabold text-white">₹{subtotal.toFixed(2)}</span>
                </div>

                <button
                  onClick={checkout}
                  disabled={checkingOut || items.length === 0}
                  className="mt-6 w-full rounded-xl bg-white px-6 py-3.5 font-bold text-gray-950 transition hover:bg-gray-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-white/10"
                >
                  {checkingOut ? "Processing Order..." : "Proceed to Checkout →"}
                </button>

                <p className="mt-4 text-center text-xs text-gray-500">
                  Transactions are secured and stock is locked in realtime.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}