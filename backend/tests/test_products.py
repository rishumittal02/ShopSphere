def test_create_product_success(client, admin_token, sample_category):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "name": "Noise Cancelling Headphones",
        "description": "Wireless headphones with ANC",
        "price": 199.99,
        "stock": 25,
        "category_id": sample_category.id,
    }
    response = client.post("/products/", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == payload["name"]
    assert float(data["price"]) == float(payload["price"])
    assert data["stock"] == payload["stock"]
    assert data["category"]["id"] == sample_category.id


def test_create_product_invalid_category(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "name": "Ghost Product",
        "description": "No category",
        "price": 49.99,
        "stock": 10,
        "category_id": 999999,
    }
    response = client.post("/products/", json=payload, headers=headers)
    assert response.status_code == 404
    assert "Category not found" in response.json()["detail"]


def test_create_product_invalid_price(client, admin_token, sample_category):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "name": "Zero Price Item",
        "price": 0,  # Invalid, must be > 0
        "stock": 10,
        "category_id": sample_category.id,
    }
    response = client.post("/products/", json=payload, headers=headers)
    assert response.status_code == 422


def test_create_product_invalid_stock(client, admin_token, sample_category):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "name": "Negative Stock Item",
        "price": 29.99,
        "stock": -5,  # Invalid, must be >= 0
        "category_id": sample_category.id,
    }
    response = client.post("/products/", json=payload, headers=headers)
    assert response.status_code == 422


def test_get_product_by_id(client, sample_product):
    response = client.get(f"/products/{sample_product.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_product.id
    assert data["name"] == sample_product.name


def test_get_product_not_found(client):
    response = client.get("/products/9999999")
    assert response.status_code == 404
    assert "Product not found" in response.json()["detail"]


def test_update_product(client, admin_token, sample_product):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "name": "Updated Smartphone X Pro",
        "description": "Upgraded processor",
        "price": 899.99,
        "stock": 15,
        "category_id": sample_product.category_id,
    }
    response = client.put(f"/products/{sample_product.id}", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Smartphone X Pro"
    assert float(data["price"]) == 899.99
    assert data["stock"] == 15


def test_delete_product(client, admin_token, sample_product):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.delete(f"/products/{sample_product.id}", headers=headers)
    assert response.status_code == 200
    assert "deleted successfully" in response.json()["message"]

    # Verify 404 after deletion
    check_response = client.get(f"/products/{sample_product.id}")
    assert check_response.status_code == 404


def test_search_products(client, sample_product, sample_category, db_session):
    from app.models.product import Product

    laptop = Product(
        name="MacBook Pro",
        description="Powerful laptop with M3 Max",
        price=1999.99,
        stock=5,
        category_id=sample_category.id,
    )
    db_session.add(laptop)
    db_session.commit()

    # Search for "MacBook"
    res = client.get("/products/?search=macbook")
    assert res.status_code == 200
    names = [p["name"] for p in res.json()]
    assert "MacBook Pro" in names
    assert sample_product.name not in names

    # Search for description term "OLED"
    res_desc = client.get("/products/?search=oled")
    assert res_desc.status_code == 200
    names_desc = [p["name"] for p in res_desc.json()]
    assert sample_product.name in names_desc


def test_filter_by_category(client, sample_product, db_session):
    from app.models.category import Category
    from app.models.product import Product

    books_cat = Category(name="Books")
    db_session.add(books_cat)
    db_session.commit()

    book = Product(
        name="Design Patterns Book",
        description="Architecture patterns",
        price=39.99,
        stock=20,
        category_id=books_cat.id,
    )
    db_session.add(book)
    db_session.commit()

    res = client.get(f"/products/?category_id={books_cat.id}")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["name"] == "Design Patterns Book"


def test_sort_products(client, sample_category, db_session):
    from app.models.product import Product

    p1 = Product(name="Alpha Product", price=10.00, stock=5, category_id=sample_category.id)
    p2 = Product(name="Beta Product", price=100.00, stock=5, category_id=sample_category.id)
    p3 = Product(name="Gamma Product", price=50.00, stock=5, category_id=sample_category.id)
    db_session.add_all([p1, p2, p3])
    db_session.commit()

    # Price asc
    res_price_asc = client.get("/products/?sort=price_asc")
    prices = [float(p["price"]) for p in res_price_asc.json()]
    assert prices == sorted(prices)

    # Price desc
    res_price_desc = client.get("/products/?sort=price_desc")
    prices_desc = [float(p["price"]) for p in res_price_desc.json()]
    assert prices_desc == sorted(prices_desc, reverse=True)


def test_pagination_products(client, sample_category, db_session):
    from app.models.product import Product

    products = [
        Product(name=f"Item {i}", price=10.0 + i, stock=5, category_id=sample_category.id)
        for i in range(15)
    ]
    db_session.add_all(products)
    db_session.commit()

    # Page 1 (limit 5, skip 0)
    res_p1 = client.get("/products/?skip=0&limit=5")
    assert res_p1.status_code == 200
    assert len(res_p1.json()) == 5

    # Page 2 (limit 5, skip 5)
    res_p2 = client.get("/products/?skip=5&limit=5")
    assert res_p2.status_code == 200
    assert len(res_p2.json()) == 5

    # Verify no item overlap
    ids_p1 = {p["id"] for p in res_p1.json()}
    ids_p2 = {p["id"] for p in res_p2.json()}
    assert ids_p1.isdisjoint(ids_p2)


def test_delete_product_with_cart_items(client, admin_token, sample_product, normal_user, db_session):
    from app.models.cart import Cart, CartItem

    # Create a cart with this product for a user
    cart = Cart(user_id=normal_user.id)
    db_session.add(cart)
    db_session.flush()

    cart_item = CartItem(cart_id=cart.id, product_id=sample_product.id, quantity=2)
    db_session.add(cart_item)
    db_session.commit()

    # Deleting product should succeed and auto-clean cart_items
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.delete(f"/products/{sample_product.id}", headers=headers)
    assert response.status_code == 200
    assert "deleted successfully" in response.json()["message"]

    # Verify cart item was cleaned up
    remaining = db_session.query(CartItem).filter(CartItem.product_id == sample_product.id).all()
    assert len(remaining) == 0


def test_delete_product_linked_to_orders(client, admin_token, sample_product, normal_user, db_session):
    from app.models.order import Order, OrderItem
    from decimal import Decimal

    # Create an order with this product
    order = Order(user_id=normal_user.id, total_amount=Decimal("99.99"), status="pending")
    db_session.add(order)
    db_session.flush()

    order_item = OrderItem(order_id=order.id, product_id=sample_product.id, quantity=1, price=sample_product.price)
    db_session.add(order_item)
    db_session.commit()

    # Attempting to delete should return 400 with a descriptive error
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.delete(f"/products/{sample_product.id}", headers=headers)
    assert response.status_code == 400
    assert "linked to 1 past customer order" in response.json()["detail"]
    assert "set its stock to 0" in response.json()["detail"]


def test_create_and_fetch_product_reviews(client, normal_user_token, sample_product):
    headers = {"Authorization": f"Bearer {normal_user_token}"}

    # Fetch initial empty reviews
    empty_res = client.get(f"/products/{sample_product.id}/reviews")
    assert empty_res.status_code == 200
    assert empty_res.json()["total_reviews"] == 0
    assert empty_res.json()["average_rating"] == 0.0

    # Post a new review
    create_res = client.post(
        f"/products/{sample_product.id}/reviews",
        json={"rating": 5, "comment": "Outstanding build quality and fit!"},
        headers=headers,
    )
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["rating"] == 5
    assert created["comment"] == "Outstanding build quality and fit!"

    # Fetch reviews again - should calculate average rating and include new review
    list_res = client.get(f"/products/{sample_product.id}/reviews")
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total_reviews"] == 1
    assert data["average_rating"] == 5.0
    assert len(data["reviews"]) == 1
    assert data["reviews"][0]["comment"] == "Outstanding build quality and fit!"


def test_create_review_unauthenticated(client, sample_product):
    res = client.post(
        f"/products/{sample_product.id}/reviews",
        json={"rating": 4, "comment": "Nice product without login"},
    )
    assert res.status_code == 401


def test_create_review_invalid_rating(client, normal_user_token, sample_product):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    # Rating out of bounds (must be 1-5)
    res = client.post(
        f"/products/{sample_product.id}/reviews",
        json={"rating": 6, "comment": "Too high rating"},
        headers=headers,
    )
    assert res.status_code == 422


