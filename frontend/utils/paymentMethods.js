// Centralized Payment Methods, Saved Cards, UPI VPAs, and Invoice Utilities

export const DEFAULT_SAVED_CARDS = [
  {
    id: "card_1",
    bank: "HDFC Bank",
    name: "Regalia Gold Visa Signature",
    holderName: "John Doe",
    last4: "4829",
    expiry: "08/29",
    brand: "visa",
    isDefault: true,
    colorFrom: "from-blue-900",
    colorTo: "to-indigo-950",
  },
  {
    id: "card_2",
    bank: "ICICI Bank",
    name: "Sapphiro Mastercard Elite",
    holderName: "John Doe",
    last4: "9142",
    expiry: "11/27",
    brand: "mastercard",
    isDefault: false,
    colorFrom: "from-amber-900",
    colorTo: "to-stone-950",
  },
];

export const DEFAULT_SAVED_UPIS = [
  {
    id: "upi_1",
    vpa: "johndoe@okaxis",
    appName: "Google Pay",
    icon: "⚡",
    isDefault: true,
  },
  {
    id: "upi_2",
    vpa: "9876543210@ybl",
    appName: "PhonePe",
    icon: "🟣",
    isDefault: false,
  },
  {
    id: "upi_3",
    vpa: "john.orders@paytm",
    appName: "Paytm UPI",
    icon: "🔵",
    isDefault: false,
  },
];

export const DEFAULT_WALLET = {
  balance: 3500.0,
  promoCash: 500.0,
  transactions: [
    {
      id: "w_txn_1",
      title: "Festive Cashback Credited",
      date: "2026-09-28",
      amount: "+ ₹250.00",
      type: "credit",
    },
    {
      id: "w_txn_2",
      title: "Wallet Top-up via HDFC NetBanking",
      date: "2026-09-20",
      amount: "+ ₹3,000.00",
      type: "credit",
    },
    {
      id: "w_txn_3",
      title: "Welcome Bonus Credited",
      date: "2026-09-15",
      amount: "+ ₹250.00",
      type: "credit",
    },
  ],
};

const STORAGE_KEYS = {
  CARDS: "shopsphere_saved_cards",
  UPIS: "shopsphere_saved_upis",
  WALLET: "shopsphere_wallet",
  ORDER_PAYMENTS: "shopsphere_order_payments",
};

export function getSavedCards() {
  if (typeof window === "undefined") return DEFAULT_SAVED_CARDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
    return raw ? JSON.parse(raw) : DEFAULT_SAVED_CARDS;
  } catch {
    return DEFAULT_SAVED_CARDS;
  }
}

export function saveSavedCards(cards) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  } catch (err) {
    console.error("Failed to save cards:", err);
  }
}

export function getSavedUPIs() {
  if (typeof window === "undefined") return DEFAULT_SAVED_UPIS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UPIS);
    return raw ? JSON.parse(raw) : DEFAULT_SAVED_UPIS;
  } catch {
    return DEFAULT_SAVED_UPIS;
  }
}

export function saveSavedUPIs(upis) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.UPIS, JSON.stringify(upis));
  } catch (err) {
    console.error("Failed to save UPIs:", err);
  }
}

export function getWalletData() {
  if (typeof window === "undefined") return DEFAULT_WALLET;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WALLET);
    return raw ? JSON.parse(raw) : DEFAULT_WALLET;
  } catch {
    return DEFAULT_WALLET;
  }
}

export function saveWalletData(wallet) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
  } catch (err) {
    console.error("Failed to save wallet:", err);
  }
}

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
  const m = (methodString || "UPI").toLowerCase();
  if (m.includes("upi") || m.includes("gpay") || m.includes("phonepe")) {
    return {
      icon: "⚡",
      label: methodString || "UPI (Instant)",
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      status: "Verified & Settled",
    };
  }
  if (m.includes("card") || m.includes("visa") || m.includes("mastercard")) {
    return {
      icon: "💳",
      label: methodString || "Credit / Debit Card",
      color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
      status: "Tokenized & Paid",
    };
  }
  if (m.includes("cash") || m.includes("cod") || m.includes("delivery")) {
    return {
      icon: "💵",
      label: "Cash on Delivery",
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      status: "Pay ₹ on Delivery",
    };
  }
  if (m.includes("net") || m.includes("bank")) {
    return {
      icon: "🏛",
      label: methodString || "Net Banking",
      color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
      status: "NEFT/RTGS Verified",
    };
  }
  if (m.includes("emi")) {
    return {
      icon: "📅",
      label: methodString || "Easy EMI",
      color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
      status: "Approved & Active",
    };
  }
  return {
    icon: "💰",
    label: methodString || "Electronic Payment",
    color: "text-gray-300 border-gray-600 bg-gray-800",
    status: "Completed",
  };
}
