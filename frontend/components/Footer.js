import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-800/80 bg-gray-950 text-gray-400 text-xs">
      {/* TRUST & PAYMENT GUARANTEE BANNER */}
      <div className="border-b border-gray-800/80 bg-gray-900/40 py-8 px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">🔒</span>
            <span className="font-bold text-white text-xs">100% Secure Checkout</span>
            <span className="text-[11px] text-gray-500">256-Bit Bank Grade SSL Encryption</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-white text-xs">Instant UPI & Cards</span>
            <span className="text-[11px] text-gray-500">Zero processing fees across India</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">💵</span>
            <span className="font-bold text-white text-xs">Cash on Delivery</span>
            <span className="text-[11px] text-gray-500">Pay cash or scan QR at doorstep</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">🔄</span>
            <span className="font-bold text-white text-xs">7-Day Free Returns</span>
            <span className="text-[11px] text-gray-500">No questions asked instant refunds</span>
          </div>
        </div>
      </div>

      {/* ACCEPTED PAYMENT METHODS SHOWCASE */}
      <div className="border-b border-gray-800/80 py-6 px-4 sm:px-6 lg:px-10 bg-gray-950">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
              Accepted Payment Methods:
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Visa */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 font-mono font-bold text-blue-400 text-xs tracking-wider">
              VISA
            </div>
            {/* Mastercard */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 font-mono font-bold text-amber-500 text-xs tracking-wider">
              Mastercard
            </div>
            {/* RuPay */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 font-mono font-bold text-emerald-400 text-xs tracking-wider">
              RuPay
            </div>
            {/* Amex */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 font-mono font-bold text-cyan-400 text-xs tracking-wider">
              AMEX
            </div>
            {/* UPI */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 font-mono font-bold text-emerald-300 text-xs tracking-wider flex items-center gap-1">
              <span>⚡</span> UPI
            </div>
            {/* Google Pay */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 font-mono font-bold text-blue-300 text-xs tracking-wider">
              Google Pay
            </div>
            {/* PhonePe */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 font-mono font-bold text-purple-400 text-xs tracking-wider">
              PhonePe
            </div>
            {/* Paytm */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 font-mono font-bold text-sky-400 text-xs tracking-wider">
              Paytm
            </div>
            {/* Net Banking */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 font-mono font-bold text-gray-300 text-xs tracking-wider">
              NetBanking
            </div>
            {/* COD */}
            <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 font-mono font-bold text-emerald-400 text-xs tracking-wider">
              COD Available
            </div>
          </div>
        </div>
      </div>

      {/* SITEMAP & BRAND LINKS */}
      <div className="mx-auto max-w-7xl py-10 px-4 sm:px-6 lg:px-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 font-black text-white text-xs">
              S
            </span>
            <span className="text-base font-black text-white tracking-tight">ShopSphere</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            India&apos;s premier multi-category online destination for top-tier electronics, streetwear fashion, gaming rigs, and luxury home essentials.
          </p>
          <p className="text-[11px] text-gray-500">© 2026 ShopSphere India Ltd. All rights reserved.</p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Categories</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/products?category=Electronics" className="hover:text-blue-400 transition">Electronics & Gadgets</Link></li>
            <li><Link href="/products?category=Gaming" className="hover:text-blue-400 transition">Gaming Gear & Consoles</Link></li>
            <li><Link href="/products?category=Clothing" className="hover:text-blue-400 transition">Men & Women Apparel</Link></li>
            <li><Link href="/products?category=Footwear" className="hover:text-blue-400 transition">Sneakers & Running Shoes</Link></li>
            <li><Link href="/products?category=Accessories" className="hover:text-blue-400 transition">Watches & Accessories</Link></li>
            <li><Link href="/products?category=Home%20%26%20Living" className="hover:text-blue-400 transition">Home & Smart Living</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Customer Support</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/orders" className="hover:text-blue-400 transition">Track Your Order</Link></li>
            <li><Link href="/cart" className="hover:text-blue-400 transition">Shopping Bag & Checkout</Link></li>
            <li><Link href="/profile" className="hover:text-blue-400 transition">Manage Saved Payment Methods</Link></li>
            <li><span className="text-gray-500">Returns & Replacement Policy</span></li>
            <li><span className="text-gray-500">Shipping & Delivery Rates</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Payment & Security</h4>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            ShopSphere employs 256-bit SSL encryption and strict PCI-DSS compliance. We never store complete credit card numbers on our servers.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
            <span>🛡️</span>
            <span>Verified Merchant • 100% Purchase Protection</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
