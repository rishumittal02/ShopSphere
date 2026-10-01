"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../utils/api";
import { getPaymentBadge } from "../../../utils/paymentMethods";

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

  // Filters & Search
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const method = (order.payment_method || "UPI").toLowerCase();
    let matchesPayment = true;
    if (paymentFilter === "upi") {
      matchesPayment = method.includes("upi");
    } else if (paymentFilter === "card") {
      matchesPayment = method.includes("card") || method.includes("visa");
    } else if (paymentFilter === "cod") {
      matchesPayment = method.includes("cash") || method.includes("cod");
    } else if (paymentFilter === "netbanking") {
      matchesPayment = method.includes("net") || method.includes("bank");
    }

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      String(order.id).includes(query) ||
      (order.user?.name && order.user.name.toLowerCase().includes(query)) ||
      (order.user?.email && order.user.email.toLowerCase().includes(query));

    return matchesPayment && matchesStatus && matchesSearch;
  });

  // Calculate revenue & stats
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const upiCount = orders.filter((o) => (o.payment_method || "UPI").toLowerCase().includes("upi")).length;
  const cardCount = orders.filter((o) => (o.payment_method || "").toLowerCase().includes("card")).length;
  const codCount = orders.filter((o) => (o.payment_method || "").toLowerCase().includes("cash") || (o.payment_method || "").toLowerCase().includes("cod")).length;

  if (authLoading || (loading && user?.role === "admin")) {
    return (
      <main className="min-h-screen bg-gray-950 px-6 py-12 text-white md:px-10">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-900" />
          <div className="rounded-3xl border border-gray-800 bg-gray-950/60 p-8 space-y-4">
            <div className="h-16 w-full rounded bg-gray-900" />
            <div className="h-16 w-full rounded bg-gray-900" />
          </div>
        </div>
      </main>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <main className="min-h-screen bg-gray-950 px-6 py-16 text-center text-white">
        <div className="mx-auto max-w-md rounded-3xl border border-gray-800 bg-gray-950/80 p-8">
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
    <main className="min-h-screen bg-gray-950 px-4 sm:px-6 lg:px-10 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
              <Link href="/admin" className="hover:text-white transition">Dashboard</Link>
              <span>/</span>
              <span className="text-gray-200">Orders & Fulfillment</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
              Manage Orders & Payments
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-400">
              Audit customer purchases, inspect payment methods, and update order fulfillment lifecycle.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/products"
              className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 transition"
            >
              📦 Manage Products
            </Link>
            <Link
              href="/admin"
              className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 transition"
            >
              ← Admin Home
            </Link>
          </div>
        </div>

        {/* Financial & Payment Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-gray-800/80 bg-gray-900/50 p-4 backdrop-blur-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              Total Order Volume
            </span>
            <p className="text-2xl font-black text-white mt-1">
              ₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">
              Across {orders.length} transactions
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 backdrop-blur-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
              ⚡ UPI / QR Payments
            </span>
            <p className="text-2xl font-black text-emerald-300 mt-1">{upiCount}</p>
            <span className="text-[10px] text-gray-400 font-semibold mt-0.5 block">
              Instant Bank Settlement
            </span>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4 backdrop-blur-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block">
              💳 Card Payments
            </span>
            <p className="text-2xl font-black text-blue-300 mt-1">{cardCount}</p>
            <span className="text-[10px] text-gray-400 font-semibold mt-0.5 block">
              Visa / Mastercard / RuPay
            </span>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 backdrop-blur-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
              💵 Cash on Delivery
            </span>
            <p className="text-2xl font-black text-amber-300 mt-1">{codCount}</p>
            <span className="text-[10px] text-gray-400 font-semibold mt-0.5 block">
              Doorstep Collection
            </span>
          </div>
        </div>

        {/* Filter Bar: Payment Methods + Status + Search */}
        <div className="rounded-2xl border border-gray-800/80 bg-gray-900/50 p-4 mb-6 backdrop-blur-md space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Payment Method Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mr-1">
                Payment:
              </span>
              {[
                { id: "all", label: "All Methods", count: orders.length },
                { id: "upi", label: "⚡ UPI", count: upiCount },
                { id: "card", label: "💳 Cards", count: cardCount },
                { id: "cod", label: "💵 COD", count: codCount },
                { id: "netbanking", label: "🏛 NetBanking", count: orders.length - (upiCount + cardCount + codCount) },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPaymentFilter(tab.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                    paymentFilter === tab.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] opacity-75">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Order # or Customer..."
                className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3.5 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Empty Orders */}
        {filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-gray-800 bg-gray-900/30 p-12 text-center">
            <p className="text-base text-gray-400">No customer orders match the selected filters.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map((order) => {
              const allowedOptions = STATUS_TRANSITIONS[order.status] || [order.status];
              const isFinal = order.status === "delivered" || order.status === "cancelled";
              const statusStyle = STATUS_CONFIG[order.status] || {
                bg: "bg-gray-800",
                text: "text-gray-300",
                border: "border-gray-700",
                label: order.status,
              };

              const paymentBadge = getPaymentBadge(order.payment_method || "UPI");

              return (
                <div
                  key={order.id}
                  className="rounded-3xl border border-gray-800/80 bg-gray-900/50 p-6 shadow-xl backdrop-blur-md hover:border-gray-700 transition"
                >
                  {/* Order Head */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-black text-white">
                          Order #{order.id}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {statusStyle.label}
                        </span>

                        {/* Payment Method Badge */}
                        <span
                          className={`rounded-full px-3 py-0.5 text-xs font-bold border ${paymentBadge.color} flex items-center gap-1.5`}
                        >
                          <span>{paymentBadge.icon}</span>
                          <span>{paymentBadge.label}</span>
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
                        <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider">
                          Total Amount
                        </span>
                        <p className="text-xl font-black text-white">
                          ₹{Number(order.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      {/* Status Transition Selector */}
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          disabled={isFinal || updatingOrderId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="rounded-xl border border-gray-800 bg-gray-900 px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {allowedOptions.map((statusKey) => (
                            <option key={statusKey} value={statusKey}>
                              Update to: {STATUS_CONFIG[statusKey]?.label || statusKey}
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
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5 text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">
                            {item.product?.name || "Product"}
                          </p>
                          <p className="text-gray-400">
                            Quantity: {item.quantity} × ₹{Number(item.price).toFixed(2)}
                          </p>
                        </div>
                        <p className="font-black text-gray-300">
                          ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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