import Link from "next/link";

export default function ProductCard({
  id,
  name,
  description,
  price,
  stock,
  category,
}) {
  const isOutOfStock = stock !== undefined && stock <= 0;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-gray-700 hover:shadow-xl hover:shadow-blue-500/5">
      <div>
        <div className="flex items-center justify-between gap-2">
          {category && (
            <span className="inline-block rounded-md bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300">
              {category}
            </span>
          )}
          {stock !== undefined && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isOutOfStock
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : stock < 5
                  ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {isOutOfStock ? "Out of Stock" : stock < 5 ? `Low: ${stock} left` : "In Stock"}
            </span>
          )}
        </div>

        <h3 className="mt-3 text-lg font-bold text-white line-clamp-1">
          {name}
        </h3>

        <p className="mt-2 text-sm text-gray-400 line-clamp-2 min-h-[2.5rem]">
          {description || "No description provided."}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500 block">Price</span>
          <p className="text-2xl font-bold text-white">
            ₹{Number(price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <Link
          href={`/products/${id}`}
          className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-950 transition hover:bg-gray-200 active:scale-95 shadow-sm"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}