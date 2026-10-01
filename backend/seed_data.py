import os
from sqlalchemy import text
from app.db.base import engine

categories = [
    "Electronics",
    "Gaming",
    "Clothing",
    "Footwear",
    "Accessories",
    "Home & Living"
]

products = [
    # Clothing
    {
        "name": "Classic Denim Trucker Jacket",
        "description": "Premium rugged denim jacket with vintage wash, dual chest pockets, and durable brass button detailing.",
        "price": 3499.00,
        "stock": 25,
        "category": "Clothing"
    },
    {
        "name": "Urban Heavyweight Cotton Hoodie",
        "description": "Relaxed fit 400 GSM brushed fleece hoodie with double-layer hood and kangaroo front pocket.",
        "price": 2199.00,
        "stock": 40,
        "category": "Clothing"
    },
    {
        "name": "Tailored Slim Fit Chinos",
        "description": "Stretch-cotton twill chinos engineered for all-day comfort, mobility, and sharp modern style.",
        "price": 2499.00,
        "stock": 30,
        "category": "Clothing"
    },
    {
        "name": "Casual Linen Button-Down Shirt",
        "description": "Breathable 100% European flax linen shirt with spread collar, perfect for summer and casual layering.",
        "price": 1899.00,
        "stock": 35,
        "category": "Clothing"
    },

    # Gaming
    {
        "name": "PlayStation 5 Slim Console",
        "description": "Next-gen gaming with ultra-high speed 1TB SSD, ray tracing, and 4K HDR gaming up to 120 FPS.",
        "price": 49990.00,
        "stock": 12,
        "category": "Gaming"
    },
    {
        "name": "Xbox Elite Wireless Controller Series 2",
        "description": "Pro-level customization with adjustable-tension thumbsticks, wrap-around rubberized grip, and paddle triggers.",
        "price": 14990.00,
        "stock": 20,
        "category": "Gaming"
    },
    {
        "name": "Razer BlackWidow V4 Mechanical Keyboard",
        "description": "Tactile mechanical gaming switches with per-key Razer Chroma RGB, multi-function roller, and dedicated macro keys.",
        "price": 11499.00,
        "stock": 28,
        "category": "Gaming"
    },
    {
        "name": "SteelSeries Arctis Nova 7 Wireless Headset",
        "description": "High-fidelity gaming audio drivers with simultaneous 2.4GHz ultra-low latency and Bluetooth connectivity.",
        "price": 16999.00,
        "stock": 18,
        "category": "Gaming"
    },

    # Footwear
    {
        "name": "Nike Air Jordan 1 Retro High",
        "description": "Iconic high-top basketball sneakers crafted with full-grain leather and encapsulated Nike Air-Sole cushioning.",
        "price": 14995.00,
        "stock": 15,
        "category": "Footwear"
    },
    {
        "name": "Adidas Ultraboost Light Running Shoes",
        "description": "Lightweight performance running shoes with responsive Light BOOST midsole cushioning and Continental rubber traction.",
        "price": 12999.00,
        "stock": 22,
        "category": "Footwear"
    },
    {
        "name": "Puma Classic White Court Sneakers",
        "description": "Timeless retro tennis court silhouette with clean leather upper and plush SoftFoam+ comfort insole.",
        "price": 4499.00,
        "stock": 35,
        "category": "Footwear"
    },
    {
        "name": "Woodland Rugged Nubuck Leather Boots",
        "description": "Heavy-duty outdoor ankle boots with waterproof nubuck leather and shock-absorbing rubber lugged sole.",
        "price": 4995.00,
        "stock": 20,
        "category": "Footwear"
    },

    # Accessories
    {
        "name": "Fossil Gen 6 Smartwatch",
        "description": "Snapdragon 4100+ powered smartwatch with always-on AMOLED display, heart-rate tracking, SpO2, and rapid charging.",
        "price": 19995.00,
        "stock": 16,
        "category": "Accessories"
    },
    {
        "name": "Ray-Ban Classic Wayfarer Sunglasses",
        "description": "Polarized G-15 crystal green lenses with iconic black acetate frame, offering 100% UV protection.",
        "price": 8590.00,
        "stock": 25,
        "category": "Accessories"
    },
    {
        "name": "Bellroy Slim Leather Bi-fold Wallet",
        "description": "Premium certified environmentally tanned leather wallet with RFID protection holding 4-12 cards.",
        "price": 4299.00,
        "stock": 45,
        "category": "Accessories"
    },
    {
        "name": "Aer Day Pack 2 Tech Backpack",
        "description": "Minimalist tech commuter backpack designed with ballistic Cordura nylon, padded laptop compartment, and self-standing base.",
        "price": 9999.00,
        "stock": 18,
        "category": "Accessories"
    },

    # Home & Living
    {
        "name": "Nespresso Vertuo Pop Coffee Machine",
        "description": "Compact one-touch espresso and coffee brewing system with Centrifusion extraction for rich crema.",
        "price": 15999.00,
        "stock": 14,
        "category": "Home & Living"
    },
    {
        "name": "Ergonomic High-Back Mesh Chair",
        "description": "Premium office desk chair with adaptive lumbar support, 3D armrests, recline lock, and breathable mesh back.",
        "price": 13999.00,
        "stock": 20,
        "category": "Home & Living"
    },
    {
        "name": "Dyson Pure Cool Link Air Purifier",
        "description": "360-degree Glass HEPA filter removes 99.95% of pollutants and allergens with intelligent real-time air monitoring.",
        "price": 34900.00,
        "stock": 8,
        "category": "Home & Living"
    },
    {
        "name": "Philips Hue Smart LED Desk Lamp",
        "description": "16 million colors with wireless app control, preset reading modes, and smart voice assistant compatibility.",
        "price": 3999.00,
        "stock": 30,
        "category": "Home & Living"
    }
]

def seed():
    with engine.begin() as conn:
        print("Checking & seeding categories...")
        cat_map = {}
        for cat in categories:
            # Check if category exists (case-insensitive)
            res = conn.execute(text("SELECT id, name FROM categories WHERE LOWER(name) = LOWER(:name)"), {"name": cat}).fetchone()
            if res:
                cat_map[cat] = res[0]
                print(f"  Category exists: {res[1]} (id: {res[0]})")
            else:
                conn.execute(text("INSERT INTO categories (name) VALUES (:name)"), {"name": cat})
                new_id = conn.execute(text("SELECT id FROM categories WHERE name = :name"), {"name": cat}).scalar()
                cat_map[cat] = new_id
                print(f"  + Added category: {cat} (id: {new_id})")

        print("\nChecking & seeding products...")
        added_count = 0
        for p in products:
            cat_id = cat_map.get(p["category"])
            if not cat_id:
                print(f"  ! Warning: category {p['category']} not found")
                continue
            
            # Check if product name exists
            res = conn.execute(text("SELECT id FROM products WHERE name = :name"), {"name": p["name"]}).fetchone()
            if res:
                print(f"  Product already exists: {p['name']}")
            else:
                conn.execute(text("""
                    INSERT INTO products (name, description, price, stock, category_id)
                    VALUES (:name, :description, :price, :stock, :category_id)
                """), {
                    "name": p["name"],
                    "description": p["description"],
                    "price": p["price"],
                    "stock": p["stock"],
                    "category_id": cat_id
                })
                added_count += 1
                print(f"  + Added product: {p['name']} (Rs. {p['price']}) in {p['category']}")

        print(f"\nSeeding complete! Successfully added {added_count} new products across all categories.")

if __name__ == "__main__":
    seed()
