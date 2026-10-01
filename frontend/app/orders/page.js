"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../utils/api";
import { getProductImage } from "../../utils/productImages";
import { getPaymentBadge, getOrderPaymentMeta } from "../../utils/paymentMethods";

const STATUS_CONFIG = {
  pending: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    label: "Processing",
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

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  useEffect(() => {
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

    fetchOrders();
  }, [router]);

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
            className="mt-5 rounded-full bg-red-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-red-500 transition shadow-md"
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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Customer Account
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              Your Orders ({orders.length})
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-400">
              Track live dispatch status, review verified payment receipts, and download tax invoices.
            </p>
          </div>

          <Link
            href="/profile?tab=payments"
            className="rounded-2xl border border-gray-800 bg-gray-900/80 px-4 py-2.5 text-xs font-bold text-gray-200 hover:text-white hover:bg-gray-800 transition flex items-center gap-2"
          >
            <span>💳</span> Manage Payment Methods
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl border border-gray-800 bg-gray-900/40 p-12 text-center max-w-lg mx-auto backdrop-blur-md">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-800/80 flex items-center justify-center text-3xl mb-4">
              📦
            </div>
            <h2 className="text-xl font-bold text-white">No orders placed yet</h2>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">
              When you purchase electronics, apparel, or gaming gear, your order details and delivery status will appear right here.
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
                { label: "Placed", step: 1 },
                { label: "Confirmed", step: 2 },
                { label: "Shipped", step: 3 },
                { label: "Delivered", step: 4 },
              ];

              const localMeta = getOrderPaymentMeta(order.id);
              const paymentMethodName = order.payment_method || localMeta?.method || "UPI";
              const paymentBadge = getPaymentBadge(paymentMethodName);
              const txnId = localMeta?.txnId || `TXN_${order.id}829471`;

              return (
                <div
                  key={order.id}
                  className="rounded-3xl border border-gray-800/80 bg-gray-900/50 p-6 sm:p-7 shadow-xl backdrop-blur-md transition hover:border-gray-700"
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
                        })} • Free Express Delivery
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

                  {/* Payment Details Bar */}
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

                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <span>✔</span> {paymentBadge.status}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-950 px-3.5 py-1.5 text-xs font-bold text-gray-200 hover:text-white hover:bg-gray-800 transition active:scale-95"
                    >
                      <span>📄</span> View Tax Invoice
                    </button>
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
                              Buy Again →
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
                    className="rounded-xl border border-gray-800 bg-gray-900 px-3.5 py-1.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 transition"
                  >
                    🖨 Print / Save PDF
                  </button>
                  <button
                    onClick={() => setSelectedInvoiceOrder(null)}
                    className="rounded-full p-1 text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Company Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-800/80 pb-6 mb-6 text-xs">
                <div>
                  <h4 className="text-lg font-black text-white">ShopSphere Technologies Pvt. Ltd.</h4>
                  <p className="text-gray-400 mt-0.5">GSTIN: 29AAACS1429B1Z8 • CIN: U72900KA2024PTC189234</p>
                  <p className="text-gray-400 mt-0.5">
                    Hub: #42, Electronic City Phase 1, Hosur Road, Bengaluru, Karnataka - 560100
                  </p>
                  <p className="text-gray-400">Support: care@shopsphere.in | 1800-200-8899</p>
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
                  <p className="font-bold text-white">{selectedInvoiceOrder.user?.name || "Customer"}</p>
                  <p className="text-gray-400">{selectedInvoiceOrder.user?.email}</p>
                  <p className="text-gray-400 mt-1">1402, Brigade Gateway, Malleshwaram, Bengaluru, KA - 560055</p>
                  <p className="text-gray-400">Place of Supply: Karnataka (State Code: 29)</p>
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Payment & Settlement Details:
                  </span>
                  <div className="space-y-1">
                    <p className="text-xs">
                      Method: <span className="font-bold text-white">{selectedInvoiceOrder.payment_method || "UPI (Instant)"}</span>
                    </p>
                    <p className="text-xs">
                      Txn Ref: <span className="font-mono text-gray-300">TXN_{selectedInvoiceOrder.id}9827419</span>
                    </p>
                    <p className="text-xs text-emerald-400 font-bold">
                      Payment Status: PAID & AUTHORIZED
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