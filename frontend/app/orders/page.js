"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../utils/api";

const STATUS_CONFIG = {
  pending: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
    label: "Pending",
  },
  confirmed: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    label: "Confirmed",
  },
  shipped: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
    label: "Shipped",
  },
  delivered: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    label: "Delivered",
  },
  cancelled: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
    label: "Cancelled",
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

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Failed to fetch orders"
          );
        }

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
      <main className="min-h-screen bg-gray-900 px-6 py-12 text-white md:px-10">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-800" />
          <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-8 space-y-4">
            <div className="h-12 w-full rounded bg-gray-800/80" />
            <div className="h-16 w-full rounded bg-gray-800/60" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-900 px-6 py-12 text-white md:px-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center">
          <p className="text-red-400 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 px-6 py-12 text-white md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Order History
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Track and view previous purchases and fulfillment statuses.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-800/80 flex items-center justify-center text-3xl mb-4">
              📦
            </div>
            <h2 className="text-xl font-bold text-white">No orders placed yet</h2>
            <p className="mt-2 text-sm text-gray-400">
              When you purchase items, your order history will appear here.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-950 hover:bg-gray-200 transition"
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
              };

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-gray-800 bg-gray-950/80 p-6 shadow-xl backdrop-blur"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-white">
                          Order #{order.id}
                        </h2>
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
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
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-gray-400 block">Total</span>
                      <p className="text-xl font-extrabold text-white">
                        ₹{Number(order.total_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="mt-4 divide-y divide-gray-800/60">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {item.product?.name || "Product"}
                          </p>
                          <p className="text-xs text-gray-400">
                            Quantity: {item.quantity} × ₹{Number(item.price).toFixed(2)}
                          </p>
                        </div>

                        <p className="text-sm font-bold text-gray-300">
                          ₹{(Number(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
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