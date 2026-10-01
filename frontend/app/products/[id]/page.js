"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";
import { getProductImage, getProductMeta, getProductReviews } from "../../../utils/productImages";

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

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [helpfulVotes, setHelpfulVotes] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    author: "",
    city: "",
    rating: 5,
    title: "",
    comment: ""
  });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Delivery check state
  const [pincode, setPincode] = useState("560001");
  const [pincodeStatus, setPincodeStatus] = useState("FREE Express Delivery by Tomorrow, 5 PM");

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
        setReviews(getProductReviews(data));
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
        throw new Error(data.detail || "Failed to add product to cart");
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

  const handleHelpfulVote = (reviewId) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1
    }));
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newReview.author.trim() || !newReview.comment.trim()) return;

    const submitted = {
      id: Date.now(),
      author: newReview.author.trim(),
      city: newReview.city.trim() || "Verified Shopper",
      rating: Number(newReview.rating),
      date: "Just now",
      verified: true,
      helpfulCount: 1,
      title: newReview.title.trim() || "Great purchase!",
      comment: newReview.comment.trim()
    };

    setReviews([submitted, ...reviews]);
    setNewReview({ author: "", city: "", rating: 5, title: "", comment: "" });
    setShowReviewModal(false);
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 5000);
  };

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (pincode.length === 6) {
      setPincodeStatus("✓ Delivery available! Free Express delivery by tomorrow, 5 PM");
    } else {
      setPincodeStatus("Please enter a valid 6-digit PIN code");
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
            className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-500/20"
          >
            ← Back to Storefront
          </Link>
        </div>
      </main>
    );
  }

  const meta = getProductMeta(product);
  const imageUrl = getProductImage(product);
  const isOutOfStock = product.stock <= 0;
  const savings = Math.max(0, meta.originalPrice - Number(product.price));
  const emiPerMonth = Math.round(Number(product.price) / 6);

  return (
    <main className="min-h-screen bg-gray-950 px-4 sm:px-6 lg:px-10 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-gray-400">
          <Link href="/" className="hover:text-blue-400 transition">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-blue-400 transition">Products</Link>
          <span>/</span>
          <span className="text-gray-300 capitalize">{product.category?.name || "General"}</span>
          <span>/</span>
          <span className="text-blue-400 line-clamp-1 font-semibold">{product.name}</span>
        </nav>

        {/* Feedback Alert Toast */}
        {feedback.message && (
          <div
            className={`mb-6 rounded-2xl p-4 text-xs font-semibold flex items-center justify-between shadow-lg ${
              feedback.type === "success"
                ? "bg-emerald-950/80 border border-emerald-500/30 text-emerald-300"
                : "bg-red-950/80 border border-red-500/30 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{feedback.type === "success" ? "✓" : "⚠"}</span>
              <span>{feedback.message}</span>
            </div>
            {feedback.type === "success" && (
              <Link
                href="/cart"
                className="ml-4 rounded-xl bg-emerald-500 px-3 py-1 font-bold text-gray-950 hover:bg-emerald-400 transition"
              >
                View Cart →
              </Link>
            )}
          </div>
        )}

        {reviewSubmitted && (
          <div className="mb-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 p-4 text-xs font-semibold text-emerald-300 shadow-lg">
            ✓ Thank you! Your review has been submitted and published below.
          </div>
        )}

        {/* Product Showcase: 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 rounded-3xl border border-gray-800/80 bg-gray-900/40 p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
          {/* Left Column: Product Image Frame */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-gray-800 bg-gray-950 shadow-inner group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={product.name}
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />

              {/* Badges Overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="rounded-full bg-blue-600/90 backdrop-blur-md px-3 py-1 text-xs font-black tracking-wider text-white shadow-lg uppercase">
                  {meta.badge}
                </span>
                <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-gray-950 shadow-md">
                  -{meta.discountPercent}% OFF
                </span>
              </div>
            </div>

            {/* Trust highlights below image */}
            <div className="grid grid-cols-3 gap-3 text-center text-[11px] text-gray-400 border border-gray-800/80 rounded-2xl p-3.5 bg-gray-950/60">
              <div>
                <span className="text-xl block mb-1">🚚</span>
                <span className="font-semibold text-gray-300 block">Free Shipping</span>
                <span className="text-[10px] text-gray-500">All India</span>
              </div>
              <div>
                <span className="text-xl block mb-1">🛡️</span>
                <span className="font-semibold text-gray-300 block">100% Genuine</span>
                <span className="text-[10px] text-gray-500">Brand Certified</span>
              </div>
              <div>
                <span className="text-xl block mb-1">🔄</span>
                <span className="font-semibold text-gray-300 block">7-Day Return</span>
                <span className="text-[10px] text-gray-500">Hassle Free</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Info & Purchase Options */}
          <div className="flex flex-col justify-between space-y-6">
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
              <p className="text-[11px] text-gray-400 mt-1">
                Inclusive of all taxes & GST. Zero-cost EMI from <strong className="text-white">₹{emiPerMonth.toLocaleString("en-IN")}/mo</strong>
              </p>

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

              {/* Product Overview Description */}
              <div className="mt-6 border-t border-gray-800/80 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Product Overview
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  {product.description || "Premium quality e-commerce product crafted with the highest standards and industry certifications."}
                </p>
              </div>

              {/* Pincode Delivery Check */}
              <div className="mt-5 rounded-2xl border border-gray-800 bg-gray-950/70 p-4">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                  Check Delivery Time & Availability
                </label>
                <form onSubmit={handleCheckPincode} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Enter 6-digit PIN code"
                    className="w-44 rounded-xl border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-gray-800 px-4 py-1.5 text-xs font-bold text-gray-200 hover:bg-gray-700 transition"
                  >
                    Check
                  </button>
                </form>
                <p className="text-[11px] text-emerald-400 mt-2 font-medium">
                  {pincodeStatus}
                </p>
              </div>
            </div>

            {/* Actions: Quantity Stepper & Dual Buttons */}
            <div className="border-t border-gray-800/80 pt-5 space-y-4">
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

              {/* PAYMENT METHODS & TRUST BADGES */}
              <div className="rounded-2xl border border-gray-800/80 bg-gray-950/80 p-4 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span className="font-bold text-gray-300 uppercase tracking-wider">Accepted Payment Methods</span>
                  <span className="text-emerald-400 font-semibold">🔒 256-Bit SSL Secure</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1 text-[11px] font-bold text-blue-400">
                    💳 Cards (Visa/Mastercard/RuPay)
                  </span>
                  <span className="rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                    ⚡ UPI (GPay/PhonePe/Paytm)
                  </span>
                  <span className="rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1 text-[11px] font-bold text-amber-400">
                    🏦 Net Banking
                  </span>
                  <span className="rounded-lg border border-gray-800 bg-gray-900 px-2.5 py-1 text-[11px] font-bold text-purple-400">
                    💵 Cash on Delivery
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOMER REVIEWS SECTION */}
        <section className="mt-12 rounded-3xl border border-gray-800/80 bg-gray-900/30 p-6 sm:p-10 backdrop-blur-md space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800/80 pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Customer Feedback</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Verified Customer Reviews</h2>
              <p className="text-xs text-gray-400 mt-1">
                Real feedback from verified purchasers across India
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-black text-amber-400">★ {meta.rating} / 5</p>
                <p className="text-[11px] text-gray-500">Based on {meta.reviewsCount} purchases</p>
              </div>

              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-500/20"
              >
                ✍ Write a Review
              </button>
            </div>
          </div>

          {/* RATING BREAKDOWN BARS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl border border-gray-800/60 bg-gray-950/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-12 text-gray-400">5 Stars</span>
              <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full w-[82%]" />
              </div>
              <span className="w-8 text-right font-semibold text-white">82%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 text-gray-400">4 Stars</span>
              <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full w-[14%]" />
              </div>
              <span className="w-8 text-right font-semibold text-white">14%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 text-gray-400">3 Stars</span>
              <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full w-[3%]" />
              </div>
              <span className="w-8 text-right font-semibold text-white">3%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 text-gray-400">2 & 1 Star</span>
              <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full w-[1%]" />
              </div>
              <span className="w-8 text-right font-semibold text-white">1%</span>
            </div>
          </div>

          {/* REVIEWS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reviews.map((rev) => {
              const helpfulCount = (rev.helpfulCount || 0) + (helpfulVotes[rev.id] || 0);
              const initials = rev.author
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

              return (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-gray-800/80 bg-gray-950/70 p-5 space-y-3 flex flex-col justify-between hover:border-gray-700 transition"
                >
                  <div className="space-y-2.5">
                    {/* Author & Avatar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                          {initials}
                        </div>
                        <div>
                          <strong className="text-white text-xs block">{rev.author}</strong>
                          <span className="text-[10px] text-gray-400">{rev.city}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                        ✓ Verified
                      </span>
                    </div>

                    {/* Rating & Date */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="text-amber-400">
                        {"★".repeat(rev.rating)}
                        {"☆".repeat(5 - rev.rating)}
                      </div>
                      <span className="text-[11px] text-gray-500">{rev.date}</span>
                    </div>

                    {/* Title & Comment */}
                    <p className="text-xs font-bold text-gray-200">{rev.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      &quot;{rev.comment}&quot;
                    </p>
                  </div>

                  {/* Helpful Button */}
                  <div className="border-t border-gray-800/60 pt-3 flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Was this review helpful?</span>
                    <button
                      type="button"
                      onClick={() => handleHelpfulVote(rev.id)}
                      className="rounded-lg bg-gray-900 border border-gray-800 px-2.5 py-1 text-gray-300 hover:text-white hover:bg-gray-800 transition font-medium"
                    >
                      👍 Helpful ({helpfulCount})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* WRITE A REVIEW MODAL */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl border border-gray-800 bg-gray-900 p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-white">Write a Review for {product.name}</h3>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={newReview.author}
                    onChange={(e) => setNewReview({ ...newReview, author: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">City / Location</label>
                    <input
                      type="text"
                      value={newReview.city}
                      onChange={(e) => setNewReview({ ...newReview, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                      className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Rating *</label>
                    <select
                      value={newReview.rating}
                      onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                      className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    >
                      <option value={5}>★★★★★ (5 Stars - Excellent)</option>
                      <option value={4}>★★★★☆ (4 Stars - Very Good)</option>
                      <option value={3}>★★★☆☆ (3 Stars - Average)</option>
                      <option value={2}>★★☆☆☆ (2 Stars - Below Average)</option>
                      <option value={1}>★☆☆☆☆ (1 Star - Poor)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Review Headline</label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    placeholder="e.g. Comfortable fit and super fast delivery!"
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Your Detailed Experience *</label>
                  <textarea
                    rows={4}
                    required
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="What did you like or dislike? How does it fit or perform? Is the build quality as described?"
                    className="w-full rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-500/25"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}