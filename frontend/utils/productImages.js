// Curated high-resolution e-commerce product imagery & metadata generator

const PRODUCT_IMAGE_MAP = {
  // Electronics
  "iphone 15": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
  "iphone duo": "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80",
  "samsung galaxy s24": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80",
  "macbook air m3": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
  "dell inspiron 15": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80",
  "gaming laptop": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80",
  "sony wh-1000xm5": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80",
  "logitech mx master 3s": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80",
  "apple ipad air": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80",
  "oneplus 12": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80",

  // Gaming
  "playstation 5 slim console": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80",
  "xbox elite wireless controller series 2": "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&auto=format&fit=crop&q=80",
  "razer blackwidow v4 mechanical keyboard": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
  "steelseries arctis nova 7 wireless headset": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80",

  // Clothing
  "classic denim trucker jacket": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80",
  "urban heavyweight cotton hoodie": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
  "tailored slim fit chinos": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
  "casual linen button-down shirt": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",

  // Footwear
  "nike air jordan 1 retro high": "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80",
  "adidas ultraboost light running shoes": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80",
  "puma classic white court sneakers": "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&auto=format&fit=crop&q=80",
  "woodland rugged nubuck leather boots": "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&auto=format&fit=crop&q=80",

  // Accessories
  "fossil gen 6 smartwatch": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
  "ray-ban classic wayfarer sunglasses": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
  "bellroy slim leather bi-fold wallet": "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
  "aer day pack 2 tech backpack": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",

  // Home & Living
  "nespresso vertuo pop coffee machine": "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80",
  "ergonomic high-back mesh chair": "https://images.unsplash.com/photo-1580481077195-c9c0499d651c?w=800&auto=format&fit=crop&q=80",
  "dyson pure cool link air purifier": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80",
  "philips hue smart led desk lamp": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80"
};

const CATEGORY_FALLBACK_MAP = {
  electronics: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&auto=format&fit=crop&q=80",
  gaming: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80",
  clothing: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80",
  footwear: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80",
  accessories: "https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=800&auto=format&fit=crop&q=80",
  "home & living": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80"
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80";

export function getProductImage(product) {
  if (!product) return DEFAULT_IMAGE;
  const nameKey = (product.name || "").toLowerCase().trim();
  if (PRODUCT_IMAGE_MAP[nameKey]) {
    return PRODUCT_IMAGE_MAP[nameKey];
  }

  // Keyword matching
  for (const [key, url] of Object.entries(PRODUCT_IMAGE_MAP)) {
    if (nameKey.includes(key) || key.includes(nameKey)) {
      return url;
    }
  }

  // Category fallback
  const catKey = (typeof product.category === "string" ? product.category : product.category?.name || "").toLowerCase().trim();
  if (CATEGORY_FALLBACK_MAP[catKey]) {
    return CATEGORY_FALLBACK_MAP[catKey];
  }

  return DEFAULT_IMAGE;
}

// Pseudo-deterministic rating & badge generator based on product ID
export function getProductMeta(product) {
  const id = product?.id || 1;
  const ratingBase = 4.2 + ((id * 7) % 8) * 0.1; // Between 4.2 and 4.9
  const rating = Math.min(5, Math.max(4, Number(ratingBase.toFixed(1))));
  const reviewsCount = 45 + ((id * 31) % 450);

  // Discount percentage (10% to 25%)
  const discountPercent = 10 + ((id * 13) % 16);
  const currentPrice = Number(product?.price || 0);
  const originalPrice = currentPrice > 0 ? currentPrice * (1 + discountPercent / 100) : 0;

  // Badges: "BESTSELLER", "HOT DEAL", "TRENDING", "NEW"
  const badges = ["BESTSELLER", "HOT DEAL", "POPULAR", "NEW ARRIVAL", "TOP RATED"];
  const badge = badges[id % badges.length];

  return {
    rating,
    reviewsCount,
    discountPercent,
    originalPrice,
    badge
  };
}
