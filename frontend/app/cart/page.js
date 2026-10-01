"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../utils/api";
import { getProductImage } from "../../utils/productImages";

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");

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

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === "SPHERE10") {
      setPromoDiscount(0.10);
      setPromoMessage("✓ Promo code SPHERE10 applied (10% OFF)!");
    } else {
      setPromoMessage("✕ Invalid promo code. Try 'SPHERE10'");
    }
  };

  const checkout = async () => {
    if (checkingOut) return;

    try {
      setCheckingOut(true);
      setError("");

      const response = await apiFetch(
        "http://localhost:8000/orders/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Checkout failed");
      }

      router.push("/orders");
    } catch (err) {
      setError(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

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
        throw new Error(data.detail || "Failed to update item quantity");
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
        throw new Error(data.detail || "Failed to remove item");
      }

      setCart(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
        "http://localhost:8000/cart/",
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to clear cart");
      }

      setCart(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 px-6 py-12 md:px-10 text-white">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-900" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-gray-900" />
              ))}
            </div>
            <div className="h-72 rounded-2xl bg-gray-900" />
          </div>
        </div>
      </main>
    );
  }

  const items = cart?.items || [];
  const rawTotal = Number(cart?.total_amount || 0);
  const discountAmount = rawTotal * promoDiscount;
  const finalTotal = Math.max(0, rawTotal - discountAmount);

  return (
    <main className="min-h-screen bg-gray-950 px-4 sm:px-6 lg:px-10 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Shopping Bag</span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              Your Cart ({items.length} {items.length === 1 ? "item" : "items"})
            </h1>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-400 hover:text-red-300 font-semibold underline"
            >
              Clear Entire Cart
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-xs font-semibold text-red-300">
            ⚠ {error}
          </div>
        )}

        {/* Empty Cart UI */}
        {items.length === 0 ? (
          <div className="rounded-3xl border border-gray-800 bg-gray-900/40 p-12 text-center max-w-lg mx-auto backdrop-blur-md">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-white">Your cart is currently empty</h2>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">
              Looks like you haven&apos;t added any items to your shopping cart yet. Explore our curated collections of electronics, apparel, and gaming gear!
            </p>
            <Link
              href="/products"
              className="mt-6 inline-block rounded-full bg-blue-600 px-8 py-3 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-500/20 active:scale-95"
            >
              Start Shopping Now →
            </Link>
          </div>
        ) : (
          /* Two-Column Checkout Layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const imageUrl = getProductImage({ name: item.product_name, category: item.category_name });
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-gray-800/80 bg-gray-900/60 p-4 sm:p-5 backdrop-blur-sm transition hover:border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      {/* Product Thumbnail */}
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={item.product_name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                          {item.category_name || "General"}
                        </span>
                        <Link href={`/products/${item.product_id}`} className="block">
                          <h3 className="text-sm font-bold text-white hover:text-blue-400 transition line-clamp-1">
                            {item.product_name}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">
                          ₹{Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })} each
                        </p>
                      </div>
                    </div>

                    {/* Quantity Stepper & Subtotal */}
                    <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-800/80">
                      <div className="flex items-center rounded-xl border border-gray-800 bg-gray-950 p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updatingId === item.product_id}
                          className="h-7 w-7 rounded-lg bg-gray-900 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="w-9 text-center text-xs font-bold text-white">
                          {updatingId === item.product_id ? "..." : item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={updatingId === item.product_id}
                          className="h-7 w-7 rounded-lg bg-gray-900 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-white">
                          ₹{Number(item.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        <button
                          onClick={() => removeItem(item.product_id)}
                          disabled={updatingId === item.product_id}
                          className="block text-[11px] text-red-400 hover:text-red-300 mt-0.5"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 rounded-3xl border border-gray-800/80 bg-gray-900/60 p-6 backdrop-blur-md space-y-5">
                <h2 className="text-lg font-bold text-white border-b border-gray-800 pb-3">
                  Order Summary
                </h2>

                <div className="space-y-3 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-white">
                      ₹{rawTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Promo Discount (10%)</span>
                      <span>− ₹{discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span>Estimated Shipping</span>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                      FREE EXPRESS
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Applicable Taxes</span>
                    <span className="text-gray-500">Included</span>
                  </div>
                </div>

                {/* Promo Code Input */}
                <form onSubmit={handleApplyPromo} className="border-t border-gray-800 pt-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Have a coupon code?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="e.g. SPHERE10"
                      className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-xs uppercase tracking-wider text-white placeholder-gray-500 outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-gray-800 px-3 py-2 text-xs font-bold text-gray-200 hover:bg-gray-700 transition"
                    >
                      Apply
                    </button>
                  </div>
                  {promoMessage && (
                    <p className={`text-[11px] mt-1.5 font-medium ${promoDiscount > 0 ? "text-emerald-400" : "text-amber-400"}`}>
                      {promoMessage}
                    </p>
                  )}
                </form>

                {/* Grand Total */}
                <div className="border-t border-gray-800 pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-white">Grand Total</span>
                    <span className="text-2xl font-black text-white">
                      ₹{finalTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Guaranteed safe & secure encrypted checkout.</p>
                </div>

                {/* Checkout CTA Button */}
                <button
                  onClick={checkout}
                  disabled={checkingOut || items.length === 0}
                  className="w-full rounded-2xl bg-blue-600 py-3.5 text-xs font-bold text-white shadow-xl shadow-blue-500/25 transition-all hover:bg-blue-500 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {checkingOut ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Placing Order...
                    </span>
                  ) : (
                    "⚡ Proceed to Checkout"
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 pt-2">
                  <span>🔒 256-Bit SSL Encryption</span>
                  <span>•</span>
                  <span>7-Day Return Policy</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}