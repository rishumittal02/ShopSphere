"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../utils/api";
import { getProductImage } from "../../utils/productImages";
import { getSavedCards, getSavedUPIs, setOrderPaymentMeta } from "../../utils/paymentMethods";

const PAYMENT_METHODS = [
  {
    id: "upi",
    title: "UPI / Instant QR",
    subtitle: "Google Pay, PhonePe, Paytm, BHIM",
    icon: "⚡",
    badge: "FASTEST & 0% FEE",
  },
  {
    id: "card",
    title: "Credit / Debit Card",
    subtitle: "Visa, Mastercard, RuPay, Amex",
    icon: "💳",
    badge: "100% SECURE",
  },
  {
    id: "netbanking",
    title: "Net Banking",
    subtitle: "HDFC, ICICI, SBI, Axis, Kotak (50+ banks)",
    icon: "🏦",
    badge: null,
  },
  {
    id: "cod",
    title: "Cash on Delivery",
    subtitle: "Pay cash or UPI at your doorstep upon arrival",
    icon: "💵",
    badge: "AVAILABLE",
  },
  {
    id: "emi",
    title: "Zero-Cost EMI / Pay Later",
    subtitle: "Starting at ₹1,499/mo on eligible bank cards",
    icon: "🏷️",
    badge: "NO EXTRA COST",
  },
];

const POPULAR_BANKS = [
  { id: "hdfc", name: "HDFC Bank", logo: "🏛️" },
  { id: "icici", name: "ICICI Bank", logo: "🏦" },
  { id: "sbi", name: "State Bank of India", logo: "🏢" },
  { id: "axis", name: "Axis Bank", logo: "🏪" },
  { id: "kotak", name: "Kotak Mahindra", logo: "🏛️" },
];

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

  // Payment method selection
  const [selectedPayment, setSelectedPayment] = useState("upi");
  const [upiId, setUpiId] = useState("user@okhdfcbank");
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8912");
  const [cardHolder, setCardHolder] = useState("Rishu Mittal");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("842");
  const [selectedBank, setSelectedBank] = useState("hdfc");
  const [selectedEmiMonths, setSelectedEmiMonths] = useState(6);

  // Payment Gateway Modal State
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [gatewayStep, setGatewayStep] = useState("input"); // 'input', 'processing', 'success'
  const [transactionId, setTransactionId] = useState("");

  // Saved Payment Methods from Profile
  const [savedCards, setSavedCards] = useState([]);
  const [savedUpis, setSavedUpis] = useState([]);

  useEffect(() => {
    setSavedCards(getSavedCards());
    setSavedUpis(getSavedUPIs());
  }, []);

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

  const openPaymentModal = () => {
    const txn = "TXN_SPHERE_" + Math.floor(100000000 + Math.random() * 900000000);
    setTransactionId(txn);
    setGatewayStep("input");
    setShowPaymentGateway(true);
  };

  const processPaymentAndCheckout = async () => {
    try {
      setGatewayStep("processing");
      setCheckingOut(true);
      setError("");

      // Simulate bank network authorization
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const selectedMethodObj = PAYMENT_METHODS.find((p) => p.id === selectedPayment);
      const chosenMethodTitle = selectedMethodObj?.title || "UPI";

      const response = await apiFetch(
        "http://localhost:8000/orders/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payment_method: chosenMethodTitle,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Checkout failed");
      }

      // Save payment meta for orders view
      setOrderPaymentMeta(data.id, {
        method: chosenMethodTitle,
        id: selectedPayment,
        txnId: transactionId || `TXN_${Date.now()}`,
        date: new Date().toISOString(),
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("last_payment_method", chosenMethodTitle);
        localStorage.setItem("last_payment_id", selectedPayment);
        localStorage.setItem("last_txn_id", transactionId || `TXN_${Date.now()}`);
      }

      setGatewayStep("success");

      setTimeout(() => {
        setShowPaymentGateway(false);
        router.push("/orders");
      }, 1800);
    } catch (err) {
      setError(err.message);
      setGatewayStep("input");
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
            {/* Left Column: Cart Items & Payment Method Selector */}
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
                            className="h-7 w-7 rounded-lg bg-gray-900 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-40"
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
                            className="h-7 w-7 rounded-lg bg-gray-900 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-40"
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

              {/* PAYMENT METHOD SELECTION ACCORDION */}
              <div className="rounded-3xl border border-gray-800/80 bg-gray-900/60 p-6 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Select Preferred Payment Method</h2>
                    <p className="text-xs text-gray-400">All transactions are secured with 256-bit bank encryption</p>
                  </div>
                  <span className="text-emerald-400 text-xs font-bold">🔒 PCI-DSS Certified</span>
                </div>

                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedPayment === method.id;
                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-500/10"
                            : "border-gray-800/80 bg-gray-950/60 hover:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{method.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <strong className="text-xs sm:text-sm font-bold text-white">{method.title}</strong>
                                {method.badge && (
                                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                                    {method.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-400">{method.subtitle}</p>
                            </div>
                          </div>

                          <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-blue-500 bg-blue-600" : "border-gray-700"
                          }`}>
                            {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                          </div>
                        </div>

                        {/* Interactive Sub-inputs for selected payment method */}
                        {isSelected && method.id === "upi" && (
                          <div className="mt-3 pt-3 border-t border-gray-800/80 space-y-2.5 text-xs">
                            {savedUpis.length > 0 && (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">
                                  Saved UPI Handles:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {savedUpis.map((u) => (
                                    <button
                                      key={u.id}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setUpiId(u.vpa);
                                      }}
                                      className={`rounded-xl px-2.5 py-1 text-[11px] font-bold border transition flex items-center gap-1.5 ${
                                        upiId === u.vpa
                                          ? "border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-sm"
                                          : "border-gray-800 bg-gray-900/80 text-gray-300 hover:text-white"
                                      }`}
                                    >
                                      <span>{u.icon}</span>
                                      <span>{u.vpa}</span>
                                      {u.isDefault && (
                                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded">Default</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-center gap-3">
                              <input
                                type="text"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                placeholder="Enter UPI ID (e.g. mobile@upi)"
                                className="w-full sm:w-64 rounded-xl border border-gray-800 bg-gray-900 px-3 py-1.5 text-white outline-none focus:border-blue-500 font-mono text-xs"
                              />
                              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                                <span>✓ GPay / PhonePe / Paytm Supported</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {isSelected && method.id === "card" && (
                          <div className="mt-3 pt-3 border-t border-gray-800/80 space-y-2.5 text-xs">
                            {savedCards.length > 0 && (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">
                                  Saved Cards (1-Click Select):
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {savedCards.map((c) => (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCardNumber(`•••• •••• •••• ${c.last4}`);
                                        setCardExpiry(c.expiry);
                                        setCardHolder(c.holderName);
                                      }}
                                      className="rounded-xl px-3 py-1.5 text-[11px] font-bold border border-gray-800 bg-gray-900/80 text-gray-300 hover:text-white hover:border-gray-700 transition flex items-center gap-2"
                                    >
                                      <span className="uppercase text-amber-400 font-mono">{c.brand}</span>
                                      <span>{c.bank} •••• {c.last4}</span>
                                      {c.isDefault && (
                                        <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1 rounded">Primary</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <input
                                type="text"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="16-Digit Card Number"
                                className="col-span-2 rounded-xl border border-gray-800 bg-gray-900 px-3 py-1.5 text-white outline-none focus:border-blue-500 font-mono text-xs"
                              />
                              <input
                                type="text"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="MM/YY"
                                className="rounded-xl border border-gray-800 bg-gray-900 px-3 py-1.5 text-white outline-none focus:border-blue-500 text-xs"
                              />
                              <input
                                type="password"
                                maxLength={3}
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value)}
                                placeholder="CVV"
                                className="rounded-xl border border-gray-800 bg-gray-900 px-3 py-1.5 text-white outline-none focus:border-blue-500 font-mono text-xs"
                              />
                            </div>
                            <input
                              type="text"
                              value={cardHolder}
                              onChange={(e) => setCardHolder(e.target.value)}
                              placeholder="Cardholder Name as on Card"
                              className="w-full rounded-xl border border-gray-800 bg-gray-900 px-3 py-1.5 text-white outline-none focus:border-blue-500 text-xs"
                            />
                          </div>
                        )}

                        {isSelected && method.id === "netbanking" && (
                          <div className="mt-3 pt-3 border-t border-gray-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {POPULAR_BANKS.map((bank) => (
                              <button
                                key={bank.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBank(bank.id);
                                }}
                                className={`rounded-xl border p-2 text-left text-xs transition flex items-center gap-2 ${
                                  selectedBank === bank.id
                                    ? "border-blue-500 bg-blue-900/30 text-white font-bold"
                                    : "border-gray-800 bg-gray-900/60 text-gray-400 hover:text-white"
                                }`}
                              >
                                <span>{bank.logo}</span>
                                <span>{bank.name}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {isSelected && method.id === "cod" && (
                          <p className="mt-2 text-[11px] text-emerald-400">
                            ✓ Pay at doorstep active. Delivery executive carries UPI QR code scanner as well.
                          </p>
                        )}

                        {isSelected && method.id === "emi" && (
                          <div className="mt-3 pt-3 border-t border-gray-800/80 flex items-center gap-2 text-xs">
                            <span className="text-gray-400">Tenure:</span>
                            {[3, 6, 9, 12].map((months) => (
                              <button
                                key={months}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEmiMonths(months);
                                }}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                  selectedEmiMonths === months
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-800 text-gray-400"
                                }`}
                              >
                                {months} Months (₹{Math.round(finalTotal / months).toLocaleString("en-IN")}/mo)
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                    <span>Applicable Taxes</span>
                    <span className="text-gray-500">Included</span>
                  </div>

                  <div className="flex justify-between pt-1 text-blue-400 border-t border-gray-800/60">
                    <span>Selected Payment</span>
                    <span className="font-semibold capitalize">
                      {PAYMENT_METHODS.find((p) => p.id === selectedPayment)?.title}
                    </span>
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
                  onClick={openPaymentModal}
                  disabled={checkingOut || items.length === 0}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-xl shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-indigo-500 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ⚡ Proceed to Payment (₹{finalTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
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

        {/* INTERACTIVE PAYMENT GATEWAY MODAL */}
        {showPaymentGateway && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl border border-gray-800 bg-gray-900 p-6 sm:p-8 shadow-2xl space-y-6">
              {gatewayStep === "input" && (
                <>
                  <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                        S
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white">ShopSphere Payment Gateway</h3>
                        <p className="text-[10px] text-gray-400">Merchant ID: SPHERE_MCH_84102</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPaymentGateway(false)}
                      className="text-gray-400 hover:text-white text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Amount to pay */}
                  <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4 text-center">
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Total Payable Amount</span>
                    <span className="text-3xl font-black text-white mt-1 block">
                      ₹{finalTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">Free Express Delivery Included</span>
                  </div>

                  {/* Payment Details based on selection */}
                  {selectedPayment === "upi" && (
                    <div className="space-y-3 text-center">
                      <p className="text-xs font-semibold text-gray-300">Scan QR Code or Approve on your UPI App</p>
                      <div className="mx-auto h-40 w-40 rounded-2xl border-2 border-dashed border-gray-700 bg-white p-3 flex flex-col items-center justify-center shadow-lg">
                        {/* Mock QR SVG */}
                        <div className="grid grid-cols-4 gap-1.5 w-full h-full p-2 bg-gray-950 rounded-lg">
                          {[...Array(16)].map((_, i) => (
                            <div
                              key={i}
                              className={`rounded-sm ${i % 3 === 0 ? "bg-white" : i % 2 === 0 ? "bg-blue-400" : "bg-transparent"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Paying to: <span className="text-white font-mono font-semibold">shopsphere@hdfcbank</span>
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-amber-400">
                        <span>⏱️ Session expires in: 04:59</span>
                      </div>
                    </div>
                  )}

                  {selectedPayment === "card" && (
                    <div className="space-y-3">
                      {/* Visual Card Representation */}
                      <div className="rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 border border-blue-500/30 p-4 shadow-xl text-white">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-mono tracking-widest text-blue-300">ShopSphere Secure Pay</span>
                          <span className="font-bold text-amber-400 text-xs">VISA</span>
                        </div>
                        <p className="font-mono text-base tracking-widest mb-3">{cardNumber}</p>
                        <div className="flex justify-between text-[11px] text-gray-300">
                          <div>
                            <span className="text-[9px] text-gray-400 block uppercase">Card Holder</span>
                            <span className="font-semibold">{cardHolder}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-400 block uppercase">Expires</span>
                            <span className="font-semibold font-mono">{cardExpiry}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 text-center">
                        Zero-Cost EMI & Bank Offers automatically applied
                      </p>
                    </div>
                  )}

                  {selectedPayment === "netbanking" && (
                    <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4 space-y-2 text-xs">
                      <p className="text-gray-300 font-semibold">Selected Bank:</p>
                      <div className="flex items-center gap-3 text-white font-bold">
                        <span className="text-xl">🏛️</span>
                        <span>{POPULAR_BANKS.find(b => b.id === selectedBank)?.name}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 pt-1">
                        You will be securely routed through your bank&apos;s two-factor authentication portal.
                      </p>
                    </div>
                  )}

                  {selectedPayment === "cod" && (
                    <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4 text-center space-y-1.5">
                      <span className="text-3xl block">💵</span>
                      <strong className="text-xs font-bold text-white block">Cash on Delivery Verified</strong>
                      <p className="text-[11px] text-gray-400">
                        Order will be dispatched immediately. Keep exact cash or UPI ready at the time of delivery.
                      </p>
                    </div>
                  )}

                  {selectedPayment === "emi" && (
                    <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4 text-center space-y-1 text-xs">
                      <strong className="text-white block font-bold">
                        {selectedEmiMonths}-Month Zero Cost EMI
                      </strong>
                      <p className="text-blue-400 font-mono font-bold text-sm">
                        ₹{Math.round(finalTotal / selectedEmiMonths).toLocaleString("en-IN")}/month
                      </p>
                      <p className="text-[10px] text-gray-400">
                        No processing fee. First installment charged on next billing cycle.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={processPaymentAndCheckout}
                      className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-xl shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition active:scale-98"
                    >
                      Authorize & Complete Payment (₹{finalTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                    </button>
                    <p className="text-[10px] text-gray-500 text-center">
                      🔒 End-to-end 256-bit encrypted • Tokenized credentials
                    </p>
                  </div>
                </>
              )}

              {gatewayStep === "processing" && (
                <div className="py-12 text-center space-y-4">
                  <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                  <h4 className="text-base font-bold text-white">Authorizing Payment...</h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    Please do not close or refresh this window while we verify your transaction with the bank network.
                  </p>
                </div>
              )}

              {gatewayStep === "success" && (
                <div className="py-10 text-center space-y-3">
                  <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 text-2xl font-bold animate-bounce">
                    ✓
                  </div>
                  <h4 className="text-xl font-black text-white">Payment Successful!</h4>
                  <p className="text-xs text-emerald-400 font-semibold font-mono">
                    Ref ID: {transactionId}
                  </p>
                  <p className="text-xs text-gray-400">
                    Your order has been confirmed and forwarded for immediate packing and dispatch. Redirecting...
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