// Payment Gateway Configuration & Badge Utilities
// Centralized for Razorpay / Stripe Integration

export const RAZORPAY_KEY_ID =
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_shopsphere2026";

export const PAYMENT_GATEWAYS = [
  {
    id: "razorpay",
    title: "Razorpay Secure Checkout",
    subtitle: "UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking & Wallets",
    icon: "⚡",
    badge: "INSTANT & 0% FEE",
    tagline: "India's #1 Secure Payment Gateway",
    providers: ["UPI", "Visa", "Mastercard", "RuPay", "50+ Banks"],
  },
];

const STORAGE_KEYS = {
  ORDER_PAYMENTS: "shopsphere_order_payments",
};

export function getOrderPaymentMeta(orderId) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.ORDER_PAYMENTS}_${orderId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setOrderPaymentMeta(orderId, meta) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.ORDER_PAYMENTS}_${orderId}`, JSON.stringify(meta));
  } catch (err) {
    console.error("Failed to set order payment meta:", err);
  }
}

export function getPaymentBadge(methodString) {
  const m = (methodString || "Razorpay").toLowerCase();

  if (m.includes("razorpay")) {
    return {
      icon: "⚡",
      label: "Razorpay (UPI / Cards / NetBanking)",
      color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
      status: "Verified & Settled",
    };
  }

  if (m.includes("stripe")) {
    return {
      icon: "💳",
      label: "Stripe Checkout",
      color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
      status: "Authorized & Secured",
    };
  }

  return {
    icon: "⚡",
    label: methodString || "Razorpay",
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    status: "Verified & Settled",
  };
}

export function getSavedCards() {
  return [];
}

export function saveSavedCards() {}

export function getSavedUPIs() {
  return [];
}

export function saveSavedUPIs() {}

export function getWalletData() {
  return { balance: 0, promoCash: 0, transactions: [] };
}

export function saveWalletData() {}

