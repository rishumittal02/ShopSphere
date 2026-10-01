"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";
import { getProductImage, getProductMeta } from "../../../utils/productImages";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || productId === "undefined") {
        setError("Invalid product ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await apiFetch(
          `http://localhost:8000/products/${productId}`
        );

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleAddToCart = async (goToCart = false) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      if (goToCart) {
        setBuyingNow(true);
      } else {
        setAddingToCart(true);
      }
      setFeedback({ type: "", message: "" });

      const response = await apiFetch(
        "http://localhost:8000/cart/items",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: product.id,
            quantity: quantity,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to add product to cart"
        );
      }

      if (goToCart) {
        router.push("/cart");
        return;
      }

      setFeedback({
        type: "success",
        message: `Added ${quantity} item(s) to your cart successfully!`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message,
      });
    } finally {
      setAddingToCart(false);
      setBuyingNow(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 px-6 py-12 md:px-10 text-white">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-5 w-40 rounded bg-gray-900" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="aspect-square rounded-2xl bg-gray-900" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded bg-gray-900" />
              <div className="h-6 w-1/3 rounded bg-gray-900" />
              <div className="h-24 w-full rounded bg-gray-900" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-gray-950 px-6 py-20 text-center text-white">
        <div className="mx-auto max-w-md rounded-3xl border border-gray-800 bg-gray-900/60 p-10 backdrop-blur-md">
          <div className="text-4xl mb-4">📦</div>
          <h1 className="text-2xl font-bold text-white">Product Not Found</h1>
          <p className="mt-2 text-xs text-gray-400">
            {error || "The product you requested might have been removed or is temporarily unavailable."}
          </p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg"
          >
            ← Back to Products
          </Link>
        </div>
      </main>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const imageUrl = getProductImage({ name: product.name, category: product.category?.name });
  const meta = getProductMeta({ id: product.id, price: product.price });
  const savings = Math.max(0, meta.originalPrice - Number(product.price));

  return (
    <main className="min-h-screen bg-gray-950 px-4 sm:px-6 lg:px-10 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-gray-400">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-white transition">Products</Link>
          <span>/</span>
          <span className="text-blue-400 font-semibold">{product.category?.name || "General"}</span>
          <span>/</span>
          <span className="text-gray-300 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Feedback Alert Notification */}
        {feedback.message && (
          <div
            className={`mb-6 rounded-2xl p-4 text-xs font-semibold flex items-center justify-between shadow-md ${
              feedback.type === "success"
                ? "border border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
                : "border border-red-500/30 bg-red-950/40 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>{feedback.type === "success" ? "✓" : "⚠"}</span>
              <span>{feedback.message}</span>
            </div>
            {feedback.type === "success" && (
              <Link href="/cart" className="underline font-bold hover:text-white ml-4">
                View in Cart →
              </Link>
            )}
          </div>
        )}

        {/* Main Product Showcase (2-Column) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 rounded-3xl border border-gray-800/80 bg-gray-900/40 p-6 sm:p-10 backdrop-blur-md">
          {/* Left Column: Product Image Gallery */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={product.name}
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                  {meta.badge}
                </span>
                <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-gray-950 shadow-md">
                  -{meta.discountPercent}% OFF
                </span>
              </div>
            </div>

            {/* Trust highlights below image */}
            <div className="grid grid-cols-3 gap-3 text-center text-[11px] text-gray-400 border border-gray-800/80 rounded-xl p-3 bg-gray-950/60">
              <div>
                <span className="text-lg block">🚚</span>
                <span className="font-semibold text-gray-300">Free Shipping</span>
              </div>
              <div>
                <span className="text-lg block">🛡️</span>
                <span className="font-semibold text-gray-300">1 Year Warranty</span>
              </div>
              <div>
                <span className="text-lg block">🔄</span>
                <span className="font-semibold text-gray-300">7-Day Returns</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Info & Purchase Options */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-400">
                  {product.category?.name || "General"}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-amber-400">
                  <span>★</span>
                  <strong className="text-white">{meta.rating}</strong>
                  <span className="text-gray-500">({meta.reviewsCount} customer reviews)</span>
                </div>
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                {product.name}
              </h1>

              {/* Price & Savings */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  ₹{Number(product.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ₹{Number(meta.originalPrice).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                  Save ₹{Number(savings).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Inclusive of all taxes & duties.</p>

              {/* Stock Status Urgency */}
              <div className="mt-5">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                    isOutOfStock
                      ? "bg-red-500/10 text-red-400 border border-red-500/30"
                      : product.stock < 5
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isOutOfStock ? "bg-red-500" : product.stock < 5 ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                    }`}
                  />
                  {isOutOfStock
                    ? "Out of Stock"
                    : product.stock < 5
                    ? `Hurry, only ${product.stock} items remaining!`
                    : "In Stock - Ready for immediate dispatch"}
                </span>
              </div>

              {/* Product Description */}
              <div className="mt-6 border-t border-gray-800/80 pt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Product Overview
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {product.description || "Premium quality e-commerce product crafted with the highest standards and industry certifications."}
                </p>
              </div>

              {/* Key Features Bullet Points */}
              <div className="mt-4 space-y-1.5 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>100% Genuine & Brand Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Standard 1-Year Comprehensive Manufacturer Warranty</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Zero-Cost EMI & Cash on Delivery Available</span>
                </div>
              </div>
            </div>

            {/* Actions: Quantity Stepper & Dual Buttons */}
            <div className="mt-8 border-t border-gray-800/80 pt-6 space-y-4">
              {!isOutOfStock && (
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-gray-400">Quantity:</span>
                  <div className="flex items-center rounded-xl border border-gray-800 bg-gray-950 p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="h-8 w-8 rounded-lg bg-gray-900 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock}
                      className="h-8 w-8 rounded-lg bg-gray-900 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleAddToCart(false)}
                  disabled={isOutOfStock || addingToCart}
                  className="rounded-2xl border border-blue-500/40 bg-blue-600/20 py-3.5 text-xs font-bold text-blue-300 hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {addingToCart ? "Adding to Cart..." : "🛒 Add to Cart"}
                </button>

                <button
                  type="button"
                  onClick={() => handleAddToCart(true)}
                  disabled={isOutOfStock || buyingNow}
                  className="rounded-2xl bg-blue-600 py-3.5 text-xs font-bold text-white hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {buyingNow ? "Processing..." : "⚡ Buy Now"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section className="mt-12 rounded-3xl border border-gray-800/80 bg-gray-900/30 p-8 sm:p-10 backdrop-blur-md">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Customer Feedback</span>
              <h2 className="text-2xl font-black text-white mt-1">Verified Buyer Reviews</h2>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-amber-400">★ {meta.rating} / 5</p>
              <p className="text-xs text-gray-500">Based on {meta.reviewsCount} verified purchases</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <strong className="text-white">Aman Sharma</strong>
                <span className="text-emerald-400">✓ Verified Buyer</span>
              </div>
              <div className="text-amber-400 text-xs">★★★★★</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                &quot;Exceeded my expectations! Build quality and packaging were top-tier. Arrived within 48 hours in pristine condition.&quot;
              </p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <strong className="text-white">Pooja Patel</strong>
                <span className="text-emerald-400">✓ Verified Buyer</span>
              </div>
              <div className="text-amber-400 text-xs">★★★★★</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                &quot;Genuine product at an unbeatable price point. Setup took less than 2 minutes. Highly recommend ShopSphere!&quot;
              </p>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <strong className="text-white">Vikram Rao</strong>
                <span className="text-emerald-400">✓ Verified Buyer</span>
              </div>
              <div className="text-amber-400 text-xs">★★★★☆</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                &quot;Solid product, exactly as described in the specs. Very satisfied with customer support and tracking.&quot;
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}