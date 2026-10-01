"use client";

import Link from "next/link";
import { useState } from "react";
import { getProductImage, getProductMeta } from "../utils/productImages";
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProductCard({
  id,
  name,
  description,
  price,
  stock,
  category,
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const isOutOfStock = stock !== undefined && stock <= 0;
  const imageUrl = getProductImage({ name, category });
  const meta = getProductMeta({ id, price });

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push("/login");
      return;
    }

    if (isOutOfStock || adding) return;

    try {
      setAdding(true);
      const res = await apiFetch("http://localhost:8000/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: id, quantity: 1 }),
      });

      if (res.ok) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }
    } catch (err) {
      console.error("Quick add failed:", err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-800/80 bg-gray-900/60 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10">
      {/* Top Image Container */}
      <Link href={`/products/${id}`} className="block relative aspect-[4/3] w-full overflow-hidden bg-gray-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-108"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent opacity-60" />

        {/* Badges on Image */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-blue-600/90 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase shadow-sm backdrop-blur-md">
            {meta.badge}
          </span>
          <span className="rounded-full bg-amber-500/90 px-2 py-0.5 text-[11px] font-bold text-gray-950 shadow-sm backdrop-blur-md">
            -{meta.discountPercent}%
          </span>
        </div>

        {/* Stock pill top right */}
        <div className="absolute top-3 right-3">
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md shadow-sm ${
              isOutOfStock
                ? "bg-red-950/80 text-red-300 border border-red-500/30"
                : stock < 5
                ? "bg-amber-950/80 text-amber-300 border border-amber-500/30"
                : "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isOutOfStock ? "bg-red-400" : stock < 5 ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
              }`}
            />
            {isOutOfStock ? "Out of Stock" : stock < 5 ? `Only ${stock} Left` : "In Stock"}
          </span>
        </div>
      </Link>

      {/* Product Content Details */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-blue-400">
            {category || "General"}
          </span>

          {/* Star Ratings */}
          <div className="flex items-center gap-1 text-amber-400">
            <span>★</span>
            <span className="font-bold text-gray-200">{meta.rating}</span>
            <span className="text-gray-500">({meta.reviewsCount})</span>
          </div>
        </div>

        <Link href={`/products/${id}`} className="mt-2 block">
          <h3 className="text-base font-bold text-white transition-colors duration-200 group-hover:text-blue-400 line-clamp-1">
            {name}
          </h3>
        </Link>

        <p className="mt-1.5 text-xs text-gray-400 line-clamp-2 leading-relaxed">
          {description || "High performance e-commerce product crafted with premium quality materials."}
        </p>

        {/* Pricing & CTA */}
        <div className="mt-5 pt-3 border-t border-gray-800/80 flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-white">
                ₹{Number(price).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs text-gray-500 line-through">
                ₹{Number(meta.originalPrice).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">Free Express Delivery</span>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock || adding}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
              isOutOfStock
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : added
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                : "bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-md shadow-blue-600/20"
            }`}
            title={isOutOfStock ? "Out of stock" : "Add to cart"}
          >
            {adding ? (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : added ? (
              <>✓ Added</>
            ) : (
              <>+ Cart</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}