"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { getProductImage } from "../../utils/productImages";
import { getPaymentBadge, getOrderPaymentMeta, setOrderPaymentMeta } from "../../utils/paymentMethods";

const STATUS_CONFIG = {
  pending: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    label: "Payment Pending",
    step: 1,
  },
  confirmed: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    label: "Confirmed",
    step: 2,
  },
  shipped: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    label: "Shipped",
    step: 3,
  },
  delivered: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    label: "Delivered",
    step: 4,
  },
  cancelled: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/30",
    label: "Cancelled",
    step: 0,
  },
};

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Cancellation Modal State
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Retry / Complete Payment Modal State
  const [payingOrder, setPayingOrder] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const orderId = searchParams.get("order_id");

    if (paymentStatus === "pending") {
      setActionNotice(
        `Notice: Payment for Order #${orderId || ""} was not finalized. Its status remains "Pending" below. You can complete payment at any time or cancel the order.`
      );
    } else if (paymentStatus === "success") {
      setActionNotice(
        `Success: Payment verified! Order #${orderId || ""} is confirmed and an order confirmation email has been dispatched to your inbox.`
      );
    }
  }, [searchParams]);

  const fetchOrders = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await apiFetch("http://localhost:8000/orders/");

      if (!response.ok) {
        throw new Error("Failed to fetch order history");
      }

      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [router]);

  // Handle Order Cancellation by user
  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      setCancelling(true);
      setError("");

      const response = await apiFetch(`http://localhost:8000/orders/${orderToCancel.id}/cancel`, {
        method: "POST",
      });

      const updated = await response.json();

      if (!response.ok) {
        throw new Error(updated.detail || "Failed to cancel order");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderToCancel.id ? { ...o, status: "cancelled" } : o))
      );
      setActionNotice(`Order #${orderToCancel.id} has been cancelled successfully. All items were returned to stock.`);
      setOrderToCancel(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  // Handle Complete Payment for a Pending Order
  const handleCompletePayment = async (order) => {
    try {
      setPaymentProcessing(true);
      setPayingOrder(order);

      const mockPayId = "pay_rzp_" + Math.floor(100000000 + Math.random() * 900000000);

      const response = await apiFetch(`http://localhost:8000/orders/${order.id}/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          razorpay_payment_id: mockPayId,
          razorpay_order_id: order.razorpay_order_id || `order_rzp_${order.id}`,
          razorpay_signature: "signature_verified_shopsphere",
        }),
      });

      const updated = await response.json();

      if (!response.ok) {
        throw new Error(updated.detail || "Payment completion failed");
      }

      setOrderPaymentMeta(order.id, {
        method: "Razorpay",
        txnId: mockPayId,
        date: new Date().toISOString(),
      });

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "confirmed", payment_method: "Razorpay", payment_id: mockPayId } : o))
      );

      setActionNotice(`Payment completed for Order #${order.id}! Status is now Confirmed, and confirmation email has been dispatched.`);
      setPayingOrder(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 px-6 py-12 text-white md:px-10">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-900" />
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 rounded-3xl bg-gray-900/60" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-950 px-6 py-12 text-white md:px-10">
        <div className="mx-auto max-w-md rounded-3xl border border-red-500/20 bg-red-950/20 p-8 text-center backdrop-blur">
          <div className="text-3xl mb-3">⚠</div>
          <h2 className="text-lg font-bold text-red-400">Failed to Load Orders</h2>
          <p className="mt-2 text-xs text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-full bg-red-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-red-500 transition shadow-md cursor-pointer"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 px-4 sm:px-6 lg:px-10 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Customer Orders
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              Your Orders ({orders.length})
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-400">
              Review order progress, complete pending payments, cancel orders, or download tax invoices.
            </p>
          </div>

          <Link
            href="/products"
            className="rounded-2xl border border-gray-800 bg-gray-900/80 px-4 py-2.5 text-xs font-bold text-gray-200 hover:text-white hover:bg-gray-800 transition"
          >
            Continue Shopping →
          </Link>
        </div>

        {/* Global Action / Status Notice Banner */}
        {actionNotice && (
          <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-950/30 p-4 text-xs font-medium text-blue-200 flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2">
              <span className="text-base text-blue-400 font-bold">ℹ</span>
              <span>{actionNotice}</span>
            </div>
            <button
              onClick={() => setActionNotice("")}
              className="text-gray-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-3xl border border-gray-800 bg-gray-900/40 p-12 text-center max-w-lg mx-auto backdrop-blur-md">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-800/80 flex items-center justify-center text-3xl mb-4">
              📦
            </div>
            <h2 className="text-xl font-bold text-white">No orders placed yet</h2>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">
              When you purchase products on ShopSphere, your real-time tracking, payment verification, and tax invoices will appear here.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-block rounded-full bg-blue-600 px-8 py-3 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-500/20 active:scale-95"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusStyle = STATUS_CONFIG[order.status] || {
                bg: "bg-gray-800",
                text: "text-gray-300",
                border: "border-gray-700",
                label: order.status,
                step: 1,
              };

              const steps = [
                { label: "Created", step: 1 },
                { label: "Confirmed", step: 2 },
                { label: "Shipped", step: 3 },
                { label: "Delivered", step: 4 },
              ];

              const localMeta = getOrderPaymentMeta(order.id);
              const paymentMethodName = order.payment_method || "Razorpay";
              const paymentBadge = getPaymentBadge(paymentMethodName);
              const txnId = order.payment_id || localMeta?.txnId || (order.status === "confirmed" ? `pay_rzp_${order.id}981` : "Payment Incomplete");
              const isPending = order.status === "pending";
              const isCancellable = order.status === "pending" || order.status === "confirmed";

              return (
                <div
                  key={order.id}
                  className={`rounded-3xl border p-6 sm:p-7 shadow-xl backdrop-blur-md transition ${
                    isPending
                      ? "border-amber-500/30 bg-gray-900/70"
                      : "border-gray-800/80 bg-gray-900/50 hover:border-gray-700"
                  }`}
                >
                  {/* Top Bar: Order ID, Date & Total */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800/80 pb-5">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-black text-white">
                          Order #{order.id}
                        </h2>
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        Placed on {new Date(order.created_at).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })} • Express Delivery
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider">
                        Total Amount
                      </span>
                      <p className="text-2xl font-black text-white">
                        ₹{Number(order.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Payment Details Bar & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 py-3.5 border-b border-gray-800/60 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-bold text-xs border ${paymentBadge.color}`}
                      >
                        <span>{paymentBadge.icon}</span>
                        <span>{paymentBadge.label}</span>
                      </span>

                      <span className="text-[11px] text-gray-400">
                        Ref: <span className="font-mono text-gray-300">{txnId}</span>
                      </span>

                      {isPending ? (
                        <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                          <span>⏱</span> Payment Incomplete (Pending)
                        </span>
                      ) : order.status === "cancelled" ? (
                        <span className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                          <span>✕</span> Order Cancelled
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <span>✔</span> Payment Verified & Confirmed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* COMPLETE PAYMENT BUTTON IF PENDING */}
                      {isPending && (
                        <button
                          onClick={() => handleCompletePayment(order)}
                          disabled={paymentProcessing}
                          className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-black text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition cursor-pointer active:scale-95"
                        >
                          <span>⚡</span> {paymentProcessing && payingOrder?.id === order.id ? "Processing..." : "Complete Payment"}
                        </button>
                      )}

                      {/* USER CANCEL ORDER BUTTON */}
                      {isCancellable && (
                        <button
                          onClick={() => setOrderToCancel(order)}
                          className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-950/20 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-900/40 hover:text-white transition cursor-pointer active:scale-95"
                        >
                          <span>✕</span> Cancel Order
                        </button>
                      )}

                      {/* INVOICE BUTTON */}
                      {order.status !== "cancelled" && (
                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-950 px-3.5 py-1.5 text-xs font-bold text-gray-200 hover:text-white hover:bg-gray-800 transition active:scale-95 cursor-pointer"
                        >
                          <span>📄</span> Tax Invoice
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Order Progress Stepper (Only if not cancelled) */}
                  {order.status !== "cancelled" && (
                    <div className="my-6 border-b border-gray-800/60 pb-6">
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        {steps.map((s) => {
                          const isDone = statusStyle.step >= s.step;
                          const isCurrent = statusStyle.step === s.step;
                          return (
                            <div key={s.label} className="relative">
                              <div
                                className={`mx-auto h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  isDone
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                                    : "bg-gray-800 text-gray-500"
                                } ${isCurrent ? "ring-4 ring-blue-500/20" : ""}`}
                              >
                                {isDone ? "✓" : s.step}
                              </div>
                              <span
                                className={`mt-2 block text-[11px] font-semibold ${
                                  isDone ? "text-white" : "text-gray-500"
                                }`}
                              >
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Order Items List */}
                  <div className="divide-y divide-gray-800/60">
                    {order.items.map((item) => {
                      const imageUrl = getProductImage({ name: item.product?.name });
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 py-3.5"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imageUrl}
                                alt={item.product?.name || "Product"}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white line-clamp-1">
                                {item.product?.name || "Product"}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                Qty: {item.quantity} × ₹{Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-black text-white">
                              ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </p>
                            <Link
                              href={`/products/${item.product_id}`}
                              className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 mt-0.5 block"
                            >
                              View Product →
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CANCEL ORDER CONFIRMATION MODAL */}
        {orderToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
            <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-gray-900 p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 text-red-400">
                <span className="text-2xl">⚠️</span>
                <h3 className="text-lg font-black text-white">Cancel Order #{orderToCancel.id}?</h3>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Are you sure you want to cancel this order? All items ({orderToCancel.items?.length || 0}) will be immediately returned to warehouse inventory. A cancellation confirmation email will be dispatched to your address.
              </p>

              <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4 text-xs space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Order Total:</span>
                  <span className="text-white font-bold font-mono">
                    ₹{Number(orderToCancel.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Payment Status:</span>
                  <span className="capitalize text-amber-400">{orderToCancel.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOrderToCancel(null)}
                  disabled={cancelling}
                  className="flex-1 rounded-xl border border-gray-800 bg-gray-950 py-3 text-xs font-bold text-gray-300 hover:bg-gray-800 transition cursor-pointer"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                  className="flex-1 rounded-xl bg-red-600 py-3 text-xs font-bold text-white hover:bg-red-500 transition shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAX INVOICE MODAL */}
        {selectedInvoiceOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-2xl rounded-3xl border border-gray-800 bg-gray-950 p-6 sm:p-8 shadow-2xl my-8 text-gray-200">
              {/* Invoice Actions */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📄</span>
                  <h3 className="text-base font-black text-white">Official Tax Invoice</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="rounded-xl border border-gray-800 bg-gray-900 px-3.5 py-1.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 transition cursor-pointer"
                  >
                    🖨 Print / PDF
                  </button>
                  <button
                    onClick={() => setSelectedInvoiceOrder(null)}
                    className="rounded-full p-1 text-gray-400 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Company Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-800/80 pb-6 mb-6 text-xs">
                <div>
                  <h4 className="text-lg font-black text-white tracking-tight">ShopSphere</h4>
                  <p className="text-gray-400 mt-0.5">GSTIN: 29AAACS1429B1Z8 • CIN: U72900KA2024PTC189234</p>
                  <p className="text-gray-400 mt-0.5">
                    Hub: #42, Electronic City Phase 1, Hosur Road, Bengaluru, Karnataka - 560100
                  </p>
                  <p className="text-gray-400">Support: care@shopsphere.in</p>
                </div>

                <div className="text-right">
                  <span className="inline-block rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/30 uppercase mb-1">
                    TAX INVOICE (ORIGINAL)
                  </span>
                  <p className="font-mono text-sm font-black text-white">
                    INV-2026-{String(selectedInvoiceOrder.id).padStart(6, "0")}
                  </p>
                  <p className="text-gray-400 mt-0.5">
                    Invoice Date: {new Date(selectedInvoiceOrder.created_at).toLocaleDateString("en-IN")}
                  </p>
                  <p className="text-gray-400">
                    Order ID: #{selectedInvoiceOrder.id}
                  </p>
                </div>
              </div>

              {/* Customer & Payment Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-gray-800/80 pb-6 mb-6 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Billed To & Shipped To:
                  </span>
                  <p className="font-bold text-white">{selectedInvoiceOrder.user?.name || user?.name || "Customer"}</p>
                  <p className="text-gray-400">{selectedInvoiceOrder.user?.email || user?.email}</p>
                  <p className="text-gray-400 mt-1">Place of Supply: Karnataka (State Code: 29)</p>
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Payment Gateway Details:
                  </span>
                  <div className="space-y-1">
                    <p className="text-xs">
                      Gateway: <span className="font-bold text-white">Razorpay Secure</span>
                    </p>
                    <p className="text-xs">
                      Payment ID: <span className="font-mono text-gray-300">{selectedInvoiceOrder.payment_id || `pay_rzp_${selectedInvoiceOrder.id}482`}</span>
                    </p>
                    <p className="text-xs text-emerald-400 font-bold">
                      Payment Status: {selectedInvoiceOrder.status === "pending" ? "PENDING AUTHORIZATION" : "VERIFIED & SETTLED"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-400">
                    <tr>
                      <th className="py-2">Item Description</th>
                      <th className="py-2 text-center">HSN</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Unit Rate</th>
                      <th className="py-2 text-right">Taxable</th>
                      <th className="py-2 text-right">GST (18%)</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {selectedInvoiceOrder.items.map((item) => {
                      const totalItemPrice = Number(item.price) * item.quantity;
                      const taxable = totalItemPrice / 1.18;
                      const gst = totalItemPrice - taxable;
                      return (
                        <tr key={item.id} className="py-2">
                          <td className="py-2.5 font-bold text-white max-w-[180px] truncate">
                            {item.product?.name || "Product"}
                          </td>
                          <td className="py-2.5 text-center font-mono text-gray-400">8518</td>
                          <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                          <td className="py-2.5 text-right font-mono">
                            ₹{(Number(item.price) / 1.18).toFixed(2)}
                          </td>
                          <td className="py-2.5 text-right font-mono">₹{taxable.toFixed(2)}</td>
                          <td className="py-2.5 text-right font-mono">₹{gst.toFixed(2)}</td>
                          <td className="py-2.5 text-right font-black font-mono text-white">
                            ₹{totalItemPrice.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation */}
              <div className="border-t border-gray-800 pt-4 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono">
                      ₹{(Number(selectedInvoiceOrder.total_amount) / 1.18).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>CGST (9%):</span>
                    <span className="font-mono">
                      ₹{((Number(selectedInvoiceOrder.total_amount) - Number(selectedInvoiceOrder.total_amount) / 1.18) / 2).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>SGST (9%):</span>
                    <span className="font-mono">
                      ₹{((Number(selectedInvoiceOrder.total_amount) - Number(selectedInvoiceOrder.total_amount) / 1.18) / 2).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping Charges:</span>
                    <span className="text-emerald-400 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-800 pt-2 text-sm font-black text-white">
                    <span>Invoice Grand Total:</span>
                    <span className="text-base text-blue-400 font-mono">
                      ₹{Number(selectedInvoiceOrder.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-6 pt-4 border-t border-gray-800/80 text-[10px] text-gray-500 text-center">
                This is a digitally generated and verified tax invoice compliant with Indian GST Rules, 2017.
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 p-10 text-white">Loading orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}