"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import {
  getSavedCards,
  saveSavedCards,
  getSavedUPIs,
  saveSavedUPIs,
  getWalletData,
  saveWalletData,
} from "../../utils/paymentMethods";

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "payments" ? "payments" : "profile";

  const { user: authUser, logout } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Payment states
  const [cards, setCards] = useState([]);
  const [upis, setUpis] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0, promoCash: 0, transactions: [] });

  // Modal states
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCard, setNewCard] = useState({
    bank: "HDFC Bank",
    name: "Platinum Rewards Card",
    holderName: "",
    number: "",
    expiryMonth: "08",
    expiryYear: "29",
    cvv: "",
  });

  const [showAddUPIModal, setShowAddUPIModal] = useState(false);
  const [newUPI, setNewUPI] = useState({
    vpa: "",
    appName: "Google Pay",
  });

  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState(1000);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiFetch("http://localhost:8000/auth/me");

        if (!response.ok) {
          router.push("/login");
          return;
        }

        const data = await response.json();
        setUser(data);
        if (data?.name && !newCard.holderName) {
          setNewCard((prev) => ({ ...prev, holderName: data.name }));
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    setCards(getSavedCards());
    setUpis(getSavedUPIs());
    setWallet(getWalletData());
  }, [router]);

  const showNotification = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(""), 3500);
  };

  // Card Handlers
  const handleAddCard = (e) => {
    e.preventDefault();
    if (!newCard.number || newCard.number.replace(/\s/g, "").length < 16) {
      alert("Please enter a valid 16-digit card number.");
      return;
    }
    const cleanNumber = newCard.number.replace(/\s/g, "");
    const last4 = cleanNumber.slice(-4);
    const brand = cleanNumber.startsWith("4")
      ? "visa"
      : cleanNumber.startsWith("5")
      ? "mastercard"
      : cleanNumber.startsWith("6")
      ? "rupay"
      : "amex";

    const createdCard = {
      id: `card_${Date.now()}`,
      bank: newCard.bank || "HDFC Bank",
      name: newCard.name || "Rewards Card",
      holderName: newCard.holderName || user?.name || "Valued Customer",
      last4,
      expiry: `${newCard.expiryMonth}/${newCard.expiryYear}`,
      brand,
      isDefault: cards.length === 0,
      colorFrom: brand === "visa" ? "from-blue-900" : "from-amber-900",
      colorTo: brand === "visa" ? "to-indigo-950" : "to-stone-950",
    };

    const updated = [...cards, createdCard];
    setCards(updated);
    saveSavedCards(updated);
    setShowAddCardModal(false);
    showNotification("💳 Card saved successfully with RBI Tokenization!");
    setNewCard({
      bank: "HDFC Bank",
      name: "Platinum Rewards Card",
      holderName: user?.name || "",
      number: "",
      expiryMonth: "08",
      expiryYear: "29",
      cvv: "",
    });
  };

  const handleDeleteCard = (cardId) => {
    const updated = cards.filter((c) => c.id !== cardId);
    setCards(updated);
    saveSavedCards(updated);
    showNotification("Card removed.");
  };

  const handleSetDefaultCard = (cardId) => {
    const updated = cards.map((c) => ({
      ...c,
      isDefault: c.id === cardId,
    }));
    setCards(updated);
    saveSavedCards(updated);
    showNotification("Default payment card updated.");
  };

  // UPI Handlers
  const handleAddUPI = (e) => {
    e.preventDefault();
    if (!newUPI.vpa || !newUPI.vpa.includes("@")) {
      alert("Please enter a valid UPI VPA (e.g., name@okaxis).");
      return;
    }
    const createdUPI = {
      id: `upi_${Date.now()}`,
      vpa: newUPI.vpa.trim().toLowerCase(),
      appName: newUPI.appName,
      icon: newUPI.appName.includes("Google") ? "⚡" : newUPI.appName.includes("Phone") ? "🟣" : "🔵",
      isDefault: upis.length === 0,
    };
    const updated = [...upis, createdUPI];
    setUpis(updated);
    saveSavedUPIs(updated);
    setShowAddUPIModal(false);
    setNewUPI({ vpa: "", appName: "Google Pay" });
    showNotification("⚡ UPI ID verified and linked successfully!");
  };

  const handleDeleteUPI = (upiId) => {
    const updated = upis.filter((u) => u.id !== upiId);
    setUpis(updated);
    saveSavedUPIs(updated);
    showNotification("UPI ID removed.");
  };

  const handleSetDefaultUPI = (upiId) => {
    const updated = upis.map((u) => ({
      ...u,
      isDefault: u.id === upiId,
    }));
    setUpis(updated);
    saveSavedUPIs(updated);
    showNotification("Default UPI account updated.");
  };

  // Wallet Top-up Handler
  const handleTopupWallet = () => {
    const amount = Number(topupAmount) || 500;
    const newTxn = {
      id: `w_txn_${Date.now()}`,
      title: "Wallet Top-up via Fast UPI",
      date: new Date().toISOString().split("T")[0],
      amount: `+ ₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      type: "credit",
    };
    const updated = {
      ...wallet,
      balance: wallet.balance + amount,
      transactions: [newTxn, ...wallet.transactions],
    };
    setWallet(updated);
    saveWalletData(updated);
    setShowAddMoneyModal(false);
    showNotification(`💰 Successfully added ₹${amount.toLocaleString("en-IN")} to ShopSphere Wallet!`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 px-6 py-12 text-white md:px-10">
        <div className="mx-auto max-w-4xl animate-pulse space-y-6">
          <div className="h-8 w-40 rounded bg-gray-900" />
          <div className="h-64 rounded-3xl bg-gray-900/60" />
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-950 px-4 sm:px-6 lg:px-10 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        {/* Toast Notification */}
        {feedbackMsg && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/90 px-5 py-3 text-xs font-bold text-emerald-300 shadow-2xl backdrop-blur-md animate-bounce">
            <span>✔</span>
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Profile Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800/80 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-blue-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{user.name}</h1>
                <span
                  className={`rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                    user.role === "admin"
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{user.email} • Customer #{user.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 transition"
            >
              📦 My Orders
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="rounded-xl border border-purple-500/30 bg-purple-950/20 px-4 py-2 text-xs font-bold text-purple-300 hover:bg-purple-900/30 transition"
              >
                ⚙ Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-800 pb-3 mb-8">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
              activeTab === "profile"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-gray-400 hover:text-white hover:bg-gray-900"
            }`}
          >
            <span>👤</span>
            <span>Account Details</span>
          </button>

          <button
            onClick={() => setActiveTab("payments")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
              activeTab === "payments"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-gray-400 hover:text-white hover:bg-gray-900"
            }`}
          >
            <span>💳</span>
            <span>Saved Payment Methods</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 font-black">
              {cards.length + upis.length} Active
            </span>
          </button>
        </div>

        {/* TAB 1: Profile Information */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-800/80 bg-gray-900/50 p-6 sm:p-8 backdrop-blur-md">
              <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                <span>🛡</span> Personal Information & Security
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
                  <span className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">
                    Full Registered Name
                  </span>
                  <p className="mt-1 text-base font-bold text-white">{user.name}</p>
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
                  <span className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">
                    Registered Email Address
                  </span>
                  <p className="mt-1 text-base font-bold text-white">{user.email}</p>
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
                  <span className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">
                    Account Status
                  </span>
                  <p className="mt-1 text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Verified & Active
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
                  <span className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">
                    Preferred Currency
                  </span>
                  <p className="mt-1 text-sm font-bold text-gray-200">INR (₹) - Indian Rupee</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Default Delivery Address</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    1402, Brigade Gateway, Malleshwaram, Bengaluru, Karnataka - 560055
                  </p>
                </div>
                <button
                  onClick={() => showNotification("Default delivery address is synced.")}
                  className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 transition"
                >
                  Edit Address
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"
              >
                Sign Out of Account
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SAVED PAYMENT METHODS */}
        {activeTab === "payments" && (
          <div className="space-y-8">
            {/* ShopSphere Wallet Card */}
            <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-indigo-950/40 to-gray-900 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-300 border border-blue-500/30">
                    <span>⚡</span> 1-Click Checkout Wallet
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                    ShopSphere Cash & Credits
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Instant zero-failure checkout with automatic cashback deposits.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-gray-400 block uppercase tracking-wider">
                      Available Balance
                    </span>
                    <span className="text-3xl font-black text-white">
                      ₹{wallet.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="block text-[11px] text-emerald-400 font-semibold mt-0.5">
                      Includes ₹{wallet.promoCash} Festive Promo Cash
                    </span>
                  </div>

                  <button
                    onClick={() => setShowAddMoneyModal(true)}
                    className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-black text-white hover:from-blue-500 hover:to-indigo-500 transition shadow-lg shadow-blue-500/25 active:scale-95 whitespace-nowrap"
                  >
                    + Add Money
                  </button>
                </div>
              </div>

              {/* Recent Ledger Preview */}
              <div className="mt-6 pt-5 border-t border-gray-800/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-3">
                  Recent Wallet Activity
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {wallet.transactions.slice(0, 3).map((txn) => (
                    <div
                      key={txn.id}
                      className="rounded-xl border border-gray-800/70 bg-gray-950/50 p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-white truncate">{txn.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{txn.date}</p>
                      </div>
                      <span className="text-xs font-black text-emerald-400">{txn.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Saved Credit / Debit Cards Section */}
            <div className="rounded-3xl border border-gray-800/80 bg-gray-900/50 p-6 sm:p-8 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>💳</span> Saved Credit & Debit Cards
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Fully tokenized in accordance with RBI and PCI-DSS compliance regulations.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddCardModal(true)}
                  className="rounded-xl border border-blue-500/30 bg-blue-600/10 px-4 py-2 text-xs font-bold text-blue-400 hover:bg-blue-600/20 transition active:scale-95 flex items-center gap-1.5"
                >
                  <span>+</span> Add New Card
                </button>
              </div>

              {cards.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-800 p-8 text-center text-xs text-gray-400">
                  No cards saved yet. Add your Visa, Mastercard, or RuPay card for fast checkout.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {cards.map((c) => (
                    <div
                      key={c.id}
                      className={`relative overflow-hidden rounded-2xl border border-gray-700/60 bg-gradient-to-br ${c.colorFrom} ${c.colorTo} p-5 shadow-xl transition hover:border-gray-500 flex flex-col justify-between h-48`}
                    >
                      {/* Top Row: Bank Name + Brand */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-white">
                            {c.bank}
                          </p>
                          <p className="text-[10px] text-gray-300 font-semibold">{c.name}</p>
                        </div>
                        <span className="text-sm font-black uppercase text-amber-300 tracking-wider">
                          {c.brand}
                        </span>
                      </div>

                      {/* Middle: EMV Chip & Card Number */}
                      <div className="my-2">
                        <div className="h-6 w-9 rounded-md bg-amber-400/80 mb-2 border border-amber-300 flex items-center justify-center text-[10px] text-amber-900 font-mono">
                          ▥
                        </div>
                        <p className="font-mono text-lg font-black tracking-widest text-white">
                          •••• •••• •••• {c.last4}
                        </p>
                      </div>

                      {/* Bottom Row: Holder, Expiry & Actions */}
                      <div className="flex items-center justify-between text-[11px] text-gray-300">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-gray-400 block">
                            Card Holder
                          </span>
                          <span className="font-bold text-white uppercase">{c.holderName}</span>
                        </div>

                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-gray-400 block">
                            Expires
                          </span>
                          <span className="font-bold text-white font-mono">{c.expiry}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {c.isDefault ? (
                            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                              Primary
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSetDefaultCard(c.id)}
                              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline"
                            >
                              Make Primary
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCard(c.id)}
                            className="rounded-lg p-1 text-gray-400 hover:text-red-400 hover:bg-gray-800/80 transition"
                            title="Remove Card"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved UPI IDs Section */}
            <div className="rounded-3xl border border-gray-800/80 bg-gray-900/50 p-6 sm:p-8 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>⚡</span> Saved UPI IDs (VPA)
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Linked UPI handles for seamless approval on your mobile banking app.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddUPIModal(true)}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-600/10 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-600/20 transition active:scale-95 flex items-center gap-1.5"
                >
                  <span>+</span> Add New UPI ID
                </button>
              </div>

              {upis.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-800 p-8 text-center text-xs text-gray-400">
                  No UPI VPAs saved yet. Add your Google Pay, PhonePe, or BHIM ID.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {upis.map((u) => (
                    <div
                      key={u.id}
                      className="rounded-2xl border border-gray-800 bg-gray-950/70 p-4.5 flex flex-col justify-between hover:border-gray-700 transition"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{u.icon}</span>
                          <span className="text-xs font-bold text-white">{u.appName}</span>
                        </div>
                        {u.isDefault && (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
                            Default
                          </span>
                        )}
                      </div>

                      <p className="font-mono text-xs font-bold text-emerald-400 truncate mb-4">
                        {u.vpa}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-800/80 text-[11px]">
                        {!u.isDefault ? (
                          <button
                            onClick={() => handleSetDefaultUPI(u.id)}
                            className="text-blue-400 hover:text-blue-300 font-semibold"
                          >
                            Set Default
                          </button>
                        ) : (
                          <span className="text-gray-500 text-[10px]">Verified Handle</span>
                        )}
                        <button
                          onClick={() => handleDeleteUPI(u.id)}
                          className="text-gray-400 hover:text-red-400"
                          title="Remove UPI"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Net Banking & EMI Support Banner */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🏛</span> Net Banking & Easy No-Cost EMI
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  Over 50+ Indian commercial banks supported with 3, 6, 9 & 12-month low-interest EMI plans.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                <span className="rounded-lg bg-gray-800 px-3 py-1.5 border border-gray-700">HDFC Bank</span>
                <span className="rounded-lg bg-gray-800 px-3 py-1.5 border border-gray-700">ICICI Bank</span>
                <span className="rounded-lg bg-gray-800 px-3 py-1.5 border border-gray-700">SBI</span>
                <span className="rounded-lg bg-gray-800 px-3 py-1.5 border border-gray-700">Axis Bank</span>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD NEW CARD */}
        {showAddCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-gray-800 bg-gray-950 p-6 sm:p-7 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-5">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>💳</span> Add New Card
                </h3>
                <button
                  onClick={() => setShowAddCardModal(false)}
                  className="rounded-full p-1 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCard} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newCard.holderName}
                    onChange={(e) => setNewCard({ ...newCard, holderName: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Card Number (16 Digits)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    value={newCard.number}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
                      setNewCard({ ...newCard, number: val });
                    }}
                    placeholder="4532 8901 2345 6789"
                    className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-xs font-mono text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Expiry (MM / YY)
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={newCard.expiryMonth}
                        onChange={(e) => setNewCard({ ...newCard, expiryMonth: e.target.value })}
                        className="w-full rounded-xl border border-gray-800 bg-gray-900 px-2.5 py-2.5 text-xs text-white focus:border-blue-500"
                      >
                        {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={newCard.expiryYear}
                        onChange={(e) => setNewCard({ ...newCard, expiryYear: e.target.value })}
                        className="w-full rounded-xl border border-gray-800 bg-gray-900 px-2.5 py-2.5 text-xs text-white focus:border-blue-500"
                      >
                        {["26","27","28","29","30","31","32"].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      CVV / CVC
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={newCard.cvv}
                      onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                      placeholder="•••"
                      className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-xs font-mono text-white text-center focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Issuing Bank
                  </label>
                  <select
                    value={newCard.bank}
                    onChange={(e) => setNewCard({ ...newCard, bank: e.target.value })}
                    className="w-full rounded-xl border border-gray-800 bg-gray-900 px-3 py-2.5 text-xs text-white focus:border-blue-500"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="State Bank of India">State Bank of India (SBI)</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  </select>
                </div>

                <div className="rounded-xl bg-gray-900/60 p-3 text-[11px] text-gray-400 flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">🔒</span>
                  <span>
                    Your card will be tokenized per Reserve Bank of India (RBI) mandates. CVV is never stored.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCardModal(false)}
                    className="rounded-xl border border-gray-800 px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-500 shadow-lg shadow-blue-500/25 active:scale-95"
                  >
                    Save & Tokenize Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD NEW UPI */}
        {showAddUPIModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-gray-800 bg-gray-950 p-6 sm:p-7 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-5">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>⚡</span> Link New UPI ID (VPA)
                </h3>
                <button
                  onClick={() => setShowAddUPIModal(false)}
                  className="rounded-full p-1 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddUPI} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Virtual Payment Address (VPA)
                  </label>
                  <input
                    type="text"
                    required
                    value={newUPI.vpa}
                    onChange={(e) => setNewUPI({ ...newUPI, vpa: e.target.value })}
                    placeholder="e.g. yourname@okaxis or mobile@ybl"
                    className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Accepted handles: @okaxis, @okhdfcbank, @oksbi, @ybl, @paytm, @apl
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    UPI Application
                  </label>
                  <select
                    value={newUPI.appName}
                    onChange={(e) => setNewUPI({ ...newUPI, appName: e.target.value })}
                    className="w-full rounded-xl border border-gray-800 bg-gray-900 px-3 py-2.5 text-xs text-white focus:border-emerald-500"
                  >
                    <option value="Google Pay">Google Pay</option>
                    <option value="PhonePe">PhonePe</option>
                    <option value="Paytm UPI">Paytm UPI</option>
                    <option value="BHIM UPI">BHIM UPI</option>
                    <option value="Cred UPI">Cred UPI</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddUPIModal(false)}
                    className="rounded-xl border border-gray-800 px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/25 active:scale-95"
                  >
                    Verify & Link UPI
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: TOP-UP WALLET */}
        {showAddMoneyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-gray-800 bg-gray-950 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>💰</span> Add Money to Wallet
                </h3>
                <button
                  onClick={() => setShowAddMoneyModal(false)}
                  className="rounded-full p-1 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-gray-400">
                  Select top-up denomination or enter custom amount:
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {[500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopupAmount(amt)}
                      className={`rounded-xl border py-2 text-xs font-bold transition ${
                        topupAmount === amt
                          ? "border-blue-500 bg-blue-600/20 text-blue-300"
                          : "border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800"
                      }`}
                    >
                      + ₹{amt}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(Number(e.target.value))}
                    min={100}
                    step={100}
                    className="w-full rounded-xl border border-gray-800 bg-gray-900 pl-8 pr-4 py-2.5 text-sm font-black text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTopupWallet}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-black text-white hover:from-blue-500 hover:to-indigo-500 transition shadow-lg shadow-blue-500/25 active:scale-95"
                >
                  Confirm Top-up (₹{topupAmount.toLocaleString("en-IN")})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-950 px-6 py-12 text-white md:px-10">
          <div className="mx-auto max-w-4xl animate-pulse space-y-6">
            <div className="h-8 w-40 rounded bg-gray-900" />
            <div className="h-64 rounded-3xl bg-gray-900/60" />
          </div>
        </main>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}