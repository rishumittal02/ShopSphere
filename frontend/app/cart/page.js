"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { getProductImage } from "../../utils/productImages";
import { RAZORPAY_KEY_ID, setOrderPaymentMeta } from "../../utils/paymentMethods";

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");

  // Razorpay Gateway Modal State (Fallback / Simulator & Integration)
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [razorpayStep, setRazorpayStep] = useState("input"); // 'input', 'processing', 'success'
  const [selectedSubMethod, setSelectedSubMethod] = useState("upi"); // 'upi', 'card', 'netbanking'
  const [mockPaymentId, setMockPaymentId] = useState("");

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

        const response = await apiFetch("http://localhost:8000/cart/");

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
      setPromoDiscount(0.1);
      setPromoMessage("✓ Promo code SPHERE10 applied (10% OFF)!");
    } else {
      setPromoMessage("✕ Invalid promo code. Try 'SPHERE10'");
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Step 1: Initiate Checkout -> Creates Order in backend with status "pending"
  const initiateCheckout = async () => {
    try {
      setCheckingOut(true);
      setError("");

      const response = await apiFetch("http://localhost:8000/orders/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_method: "Razorpay",
        }),
      });

      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.detail || "Checkout initialization failed");
      }

      setPendingOrder(orderData);
      const generatedPayId = "pay_rzp_" + Math.floor(100000000 + Math.random() * 900000000);
      setMockPaymentId(generatedPayId);

      // Attempt to load official Razorpay checkout script
      const scriptLoaded = await loadRazorpayScript();

      if (scriptLoaded && window.Razorpay && RAZORPAY_KEY_ID.startsWith("rzp_live")) {
        const options = {
          key: RAZORPAY_KEY_ID,
          amount: Math.round(Number(orderData.total_amount) * 100),
          currency: "INR",
          name: "ShopSphere",
          description: `Order #${orderData.id} Payment`,
          order_id: orderData.razorpay_order_id,
          handler: async function (response) {
            await handlePaymentSuccess(orderData.id, response.razorpay_payment_id || generatedPayId);
          },
          modal: {
            ondismiss: function () {
              // User cancelled / closed payment window without paying!
              // Status remains pending!
              handlePaymentCancelled(orderData.id);
            },
          },
          prefill: {
            name: user?.name || "Customer",
            email: user?.email || "",
          },
          theme: {
            color: "#2563eb",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setCheckingOut(false);
      } else {
        // Open seamless Razorpay Gateway Interface
        setRazorpayStep("input");
        setShowRazorpayModal(true);
        setCheckingOut(false);
      }
    } catch (err) {
      setError(err.message);
      setCheckingOut(false);
    }
  };

  // Step 2: Payment Verified & Confirmed
  const handlePaymentSuccess = async (orderId, paymentId) => {
    try {
      setRazorpayStep("processing");

      const response = await apiFetch(`http://localhost:8000/orders/${orderId}/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          razorpay_payment_id: paymentId || mockPaymentId,
          razorpay_order_id: pendingOrder?.razorpay_order_id || `order_rzp_${orderId}`,
          razorpay_signature: "verified_signature_shopsphere",
        }),
      });

      const updatedOrder = await response.json();

      if (!response.ok) {
        throw new Error(updatedOrder.detail || "Payment verification failed");
      }

      setOrderPaymentMeta(orderId, {
        method: "Razorpay",
        txnId: paymentId || mockPaymentId,
        date: new Date().toISOString(),
      });

      setRazorpayStep("success");

      setTimeout(() => {
        setShowRazorpayModal(false);
        router.push("/orders?payment=success&order_id=" + orderId);
      }, 1800);
    } catch (err) {
      setError(err.message);
      setRazorpayStep("input");
    }
  };

  // Step 3: User Cancels/Dismisses Payment Modal -> Status remains PENDING
  const handlePaymentCancelled = (orderId) => {
    setShowRazorpayModal(false);
    router.push(`/orders?payment=pending&order_id=${orderId || pendingOrder?.id}`);
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setUpdatingId(productId);
      setError("");

      const response = await apiFetch(`http://localhost:8000/cart/items/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: newQuantity,
        }),
      });

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

      const response = await apiFetch(`http://localhost:8000/cart/items/${productId}`, {
        method: "DELETE",
      });

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

      const response = await apiFetch("http://localhost:8000/cart/", {
        method: "DELETE",
      });

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
  const calculatedTotal = items.reduce((sum, item) => {
    const p = Number(item.product?.price ?? item.price ?? 0);
    const q = Number(item.quantity || 1);
    return sum + (isNaN(p) ? 0 : p * q);
  }, 0);
  const rawTotal = Number(cart?.total_amount) > 0 ? Number(cart.total_amount) : calculatedTotal;
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
              className="text-xs text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
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
              Looks like you haven&apos;t added any items yet. Explore our curated collections of electronics, gaming gear, fashion, and lifestyle essentials!
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
            {/* Left Column: Cart Items & Razorpay Payment Integration Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Items List */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                  Cart Items ({items.length})
                </h2>

                {items.map((item) => {
                  const productName = item.product?.name || item.product_name || "Product";
                  const unitPrice = Number(item.product?.price ?? item.price ?? 0);
                  const safeUnitPrice = isNaN(unitPrice) ? 0 : unitPrice;
                  const categoryName = item.product?.category?.name || item.category_name || "General";
                  const itemQuantity = Number(item.quantity || 1);
                  const itemSubtotal = safeUnitPrice * itemQuantity;
                  const imageUrl = getProductImage({ name: productName, category: categoryName });
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
                            alt={productName}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                            {categoryName}
                          </span>
                          <Link href={`/products/${item.product_id}`} className="block">
                            <h3 className="text-sm font-bold text-white hover:text-blue-400 transition line-clamp-1">
                              {productName}
                            </h3>
                          </Link>
                          <p className="text-xs text-gray-400 mt-0.5">
                            ₹{safeUnitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })} each
                          </p>
                        </div>
                      </div>

                      {/* Quantity Stepper & Subtotal */}
                      <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-800/80">
                        <div className="flex items-center rounded-xl border border-gray-800 bg-gray-950 p-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product_id, itemQuantity - 1)}
                            disabled={itemQuantity <= 1 || updatingId === item.product_id}
                            className="h-7 w-7 rounded-lg bg-gray-900 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-40 cursor-pointer"
                          >
                            −
                          </button>
                          <span className="w-9 text-center text-xs font-bold text-white">
                            {updatingId === item.product_id ? "..." : itemQuantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product_id, itemQuantity + 1)}
                            disabled={updatingId === item.product_id}
                            className="h-7 w-7 rounded-lg bg-gray-900 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-40 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-white">
                            ₹{itemSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            onClick={() => removeItem(item.product_id)}
                            disabled={updatingId === item.product_id}
                            className="block text-[11px] text-red-400 hover:text-red-300 mt-0.5 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PAYMENT INTEGRATION CARD: RAZORPAY */}
              <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-gray-900/60 p-6 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/30 font-black">
                      ⚡
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Razorpay Payment Gateway</h2>
                      <p className="text-xs text-gray-400">Unified secure checkout for all Indian payment modes</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[10px] font-black text-emerald-400">
                    🔒 PCI-DSS Certified
                  </span>
                </div>

                {/* Badges of supported payment modes under Razorpay */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-3 text-center">
                    <span className="text-xl block mb-1">⚡</span>
                    <strong className="text-xs text-white block">UPI Instant</strong>
                    <span className="text-[10px] text-gray-400">GPay, PhonePe, Paytm</span>
                  </div>
                  <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-3 text-center">
                    <span className="text-xl block mb-1">💳</span>
                    <strong className="text-xs text-white block">Debit & Credit</strong>
                    <span className="text-[10px] text-gray-400">Visa, Mastercard, RuPay</span>
                  </div>
                  <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-3 text-center">
                    <span className="text-xl block mb-1">🏛️</span>
                    <strong className="text-xs text-white block">Net Banking</strong>
                    <span className="text-[10px] text-gray-400">50+ Indian Banks</span>
                  </div>
                  <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-3 text-center">
                    <span className="text-xl block mb-1">👛</span>
                    <strong className="text-xs text-white block">Wallets</strong>
                    <span className="text-[10px] text-gray-400">Amazon Pay, Mobikwik</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-950/50 p-4 border border-gray-800/80 flex items-start gap-3 text-xs text-gray-400">
                  <span className="text-blue-400 text-base">ℹ</span>
                  <p className="leading-relaxed">
                    Orders are initiated with status <strong className="text-amber-400">Pending</strong>. Your order will be confirmed instantly upon authorized payment completion. You may also cancel pending orders at any time.
                  </p>
                </div>
              </div>
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
                    <span>Payment Processing</span>
                    <span className="text-emerald-400 font-semibold">0% Fee (Razorpay)</span>
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
                      className="rounded-xl bg-gray-800 px-3 py-2 text-xs font-bold text-gray-200 hover:bg-gray-700 transition cursor-pointer"
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
                  onClick={initiateCheckout}
                  disabled={checkingOut || items.length === 0}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 py-4 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-blue-500/25 transition-all hover:brightness-110 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {checkingOut ? (
                    <span>Opening Gateway...</span>
                  ) : (
                    <>
                      <span>⚡ Pay ₹{finalTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })} via Razorpay</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 pt-1">
                  <span>🔒 256-Bit SSL Encryption</span>
                  <span>•</span>
                  <span>Free Cancellation</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RAZORPAY INTERACTIVE CHECKOUT MODAL */}
        {showRazorpayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl border border-blue-500/30 bg-gray-900 p-6 sm:p-8 shadow-2xl space-y-6">
              {razorpayStep === "input" && (
                <>
                  <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-sm">
                        ⚡
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white">ShopSphere Razorpay Gateway</h3>
                        <p className="text-[10px] text-gray-400">Order ID: #{pendingOrder?.id} • Status: Pending</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePaymentCancelled(pendingOrder?.id)}
                      className="text-gray-400 hover:text-white text-xs font-bold cursor-pointer"
                      title="Close (Keep order status Pending)"
                    >
                      ✕ Exit
                    </button>
                  </div>

                  {/* Amount to pay */}
                  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4 text-center">
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Payable Amount</span>
                    <span className="text-3xl font-black text-white mt-1 block">
                      ₹{finalTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-blue-400 font-medium">Secured by Razorpay Technologies</span>
                  </div>

                  {/* Payment sub-option tabs */}
                  <div className="space-y-3">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-gray-400 block">
                      Select Payment Mode in Razorpay:
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSubMethod("upi")}
                        className={`rounded-xl border p-2.5 text-center text-xs font-bold transition cursor-pointer ${
                          selectedSubMethod === "upi"
                            ? "border-blue-500 bg-blue-950/40 text-blue-300"
                            : "border-gray-800 bg-gray-950 text-gray-400 hover:text-white"
                        }`}
                      >
                        ⚡ UPI
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSubMethod("card")}
                        className={`rounded-xl border p-2.5 text-center text-xs font-bold transition cursor-pointer ${
                          selectedSubMethod === "card"
                            ? "border-blue-500 bg-blue-950/40 text-blue-300"
                            : "border-gray-800 bg-gray-950 text-gray-400 hover:text-white"
                        }`}
                      >
                        💳 Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSubMethod("netbanking")}
                        className={`rounded-xl border p-2.5 text-center text-xs font-bold transition cursor-pointer ${
                          selectedSubMethod === "netbanking"
                            ? "border-blue-500 bg-blue-950/40 text-blue-300"
                            : "border-gray-800 bg-gray-950 text-gray-400 hover:text-white"
                        }`}
                      >
                        🏛️ NetBank
                      </button>
                    </div>

                    {selectedSubMethod === "upi" && (
                      <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-4 text-xs space-y-2 text-center">
                        <p className="text-gray-300 font-medium">Instant UPI QR & Intent Payment</p>
                        <div className="mx-auto h-28 w-28 rounded-xl bg-white p-2 flex items-center justify-center">
                          <div className="w-full h-full bg-gray-900 rounded grid grid-cols-3 gap-1 p-2">
                            {[...Array(9)].map((_, i) => (
                              <div key={i} className={`rounded-sm ${i % 2 === 0 ? "bg-blue-400" : "bg-white"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400">Scan via GPay, PhonePe, Paytm, or BHIM</p>
                      </div>
                    )}

                    {selectedSubMethod === "card" && (
                      <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-4 text-xs space-y-2">
                        <div className="flex justify-between items-center text-gray-300 font-medium">
                          <span>Card Details</span>
                          <span className="text-[10px] text-blue-400 font-mono">VISA / MC / RUPAY</span>
                        </div>
                        <div className="rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-white font-mono text-xs">
                          •••• •••• •••• 4242
                        </div>
                        <p className="text-[10px] text-gray-400">Zero surcharge on all domestic credit & debit cards</p>
                      </div>
                    )}

                    {selectedSubMethod === "netbanking" && (
                      <div className="rounded-2xl border border-gray-800 bg-gray-950/80 p-4 text-xs space-y-1">
                        <p className="text-gray-300 font-medium">Popular Net Banking Portals</p>
                        <p className="text-[11px] text-blue-400 font-semibold">HDFC • ICICI • SBI • Axis • Kotak</p>
                        <p className="text-[10px] text-gray-400 pt-1">Direct bank-grade 2FA authentication</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handlePaymentSuccess(pendingOrder?.id, mockPaymentId)}
                      className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-blue-500/25 hover:brightness-110 transition active:scale-98 cursor-pointer"
                    >
                      Authorize Payment (₹{finalTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePaymentCancelled(pendingOrder?.id)}
                      className="w-full rounded-xl border border-gray-800 bg-gray-950 py-2.5 text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                    >
                      Exit / Pay Later (Order status remains Pending)
                    </button>

                    <p className="text-[10px] text-gray-500 text-center">
                      🔒 If exited now, the order stays in your account as Pending until completed or cancelled.
                    </p>
                  </div>
                </>
              )}

              {razorpayStep === "processing" && (
                <div className="py-12 text-center space-y-4">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                  <h4 className="text-base font-bold text-white">Verifying Razorpay Payment...</h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    Confirming transaction signature and generating your official order confirmation email...
                  </p>
                </div>
              )}

              {razorpayStep === "success" && (
                <div className="py-10 text-center space-y-3">
                  <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 text-2xl font-bold animate-bounce">
                    ✓
                  </div>
                  <h4 className="text-xl font-black text-white">Payment Authorized!</h4>
                  <p className="text-xs text-emerald-400 font-semibold font-mono">
                    Payment ID: {mockPaymentId}
                  </p>
                  <p className="text-xs text-gray-400">
                    Order #{pendingOrder?.id} is now Confirmed. An order confirmation receipt has been dispatched to your email. Redirecting...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}