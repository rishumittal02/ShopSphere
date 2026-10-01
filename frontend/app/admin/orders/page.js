"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";

const STATUS_TRANSITIONS = {
  pending: ["pending", "confirmed", "cancelled"],
  confirmed: ["confirmed", "shipped", "cancelled"],
  shipped: ["shipped", "delivered"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
};

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

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    if (authLoading || !user || user.role !== "admin") {
      return;
    }

    const fetchOrders = async () => {
      try {
        setError("");

        const response = await apiFetch(
          "http://localhost:8000/orders/admin"
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
  }, [user, authLoading]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setError("");
      setUpdatingOrderId(orderId);

      const response = await apiFetch(
        `http://localhost:8000/orders/admin/${orderId}/status?status=${newStatus}`,
        {
          method: "PUT",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to update order status"
        );
      }

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.id === orderId ? data : order
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (authLoading || (loading && user?.role === "admin")) {
    return (
      <main className="min-h-screen bg-gray-900 px-6 py-12 text-white md:px-10">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-800" />
          <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-8 space-y-4">
            <div className="h-16 w-full rounded bg-gray-800/80" />
            <div className="h-16 w-full rounded bg-gray-800/80" />
          </div>
        </div>
      </main>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <main className="min-h-screen bg-gray-900 px-6 py-16 text-center text-white">
        <div className="mx-auto max-w-md rounded-2xl border border-gray-800 bg-gray-950/80 p-8">
          <span className="text-4xl">🔒</span>
          <h1 className="mt-4 text-2xl font-bold text-white">Access Denied</h1>
          <p className="mt-2 text-sm text-gray-400">
            Administrative permissions are required to access this portal.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-950 hover:bg-gray-200 transition"
          >
            Back to Store
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 px-6 py-12 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Link href="/admin" className="hover:text-white transition">Dashboard</Link>
              <span>/</span>
              <span className="text-gray-200">Orders</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Manage Orders
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Review customer purchases, inspect order contents, and update fulfillment states.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-gray-800 bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-700 transition"
          >
            ← Admin Dashboard
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Empty Orders */}
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-12 text-center">
            <p className="text-lg text-gray-400">No customer orders have been placed yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const allowedOptions = STATUS_TRANSITIONS[order.status] || [order.status];
              const isFinal = order.status === "delivered" || order.status === "cancelled";
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
                  {/* Order Head */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-white">
                          Order #{order.id}
                        </h2>
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        Customer: <span className="font-semibold text-gray-200">{order.user?.name}</span> ({order.user?.email}) •{" "}
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block">Total</span>
                        <p className="text-xl font-extrabold text-white">
                          ₹{Number(order.total_amount).toFixed(2)}
                        </p>
                      </div>

                      {/* Status Transition Selector */}
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          disabled={isFinal || updatingOrderId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="rounded-xl border border-gray-800 bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {allowedOptions.map((statusKey) => (
                            <option key={statusKey} value={statusKey}>
                              {STATUS_CONFIG[statusKey]?.label || statusKey}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
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