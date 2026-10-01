"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../utils/api";
import { getProductImage } from "../../utils/productImages";

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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

        if (!token) {
          router.push("/login");
          return;
        }

        const response = await apiFetch(
          "http://localhost:8000/orders/"
        );

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
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Customer Account</span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
            Your Orders ({orders.length})
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-gray-400">
            Track live dispatch status, review invoices, and view purchased items.
          </p>
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
                      <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider">Total Amount</span>
                      <p className="text-2xl font-black text-white">
                        ₹{Number(order.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
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
      </div>
    </main>
  );
}