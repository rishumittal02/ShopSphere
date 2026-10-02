from decimal import Decimal


def test_checkout_empty_cart(client, normal_user_token):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = client.post("/orders/checkout", headers=headers)
    assert response.status_code == 400
    assert "Cart is empty" in response.json()["detail"]


def test_checkout_success(client, normal_user_token, sample_product, db_session):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    initial_stock = sample_product.stock
    buy_quantity = 3

    # Add item to cart
    client.post(
        "/cart/items",
        json={"product_id": sample_product.id, "quantity": buy_quantity},
        headers=headers,
    )

    # Perform checkout
    response = client.post("/orders/checkout", headers=headers)
    assert response.status_code == 200
    order = response.json()
    assert order["status"] == "pending"
    assert order.get("payment_method") == "Razorpay"
    assert len(order["items"]) == 1
    assert order["items"][0]["product_id"] == sample_product.id
    assert order["items"][0]["quantity"] == buy_quantity

    expected_total = float(sample_product.price) * buy_quantity
    assert abs(float(order["total_amount"]) - expected_total) < 0.01

    # Verify stock reduction
    db_session.refresh(sample_product)
    assert sample_product.stock == initial_stock - buy_quantity

    # Verify cart cleanup
    cart_res = client.get("/cart/", headers=headers)
    assert len(cart_res.json()["items"]) == 0


def test_checkout_with_custom_payment_method(client, normal_user_token, sample_product):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    client.post(
        "/cart/items",
        json={"product_id": sample_product.id, "quantity": 1},
        headers=headers,
    )
    response = client.post(
        "/orders/checkout",
        json={"payment_method": "Credit / Debit Card"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["payment_method"] == "Credit / Debit Card"


def test_checkout_insufficient_stock_rollback(
    client, normal_user_token, sample_product, db_session
):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    # User puts 5 in cart
    client.post(
        "/cart/items",
        json={"product_id": sample_product.id, "quantity": 5},
        headers=headers,
    )

    # Meanwhile product stock drops to 2
    sample_product.stock = 2
    db_session.commit()

    # Checkout should fail and rollback
    response = client.post("/orders/checkout", headers=headers)
    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["detail"]

    # Stock should remain 2
    db_session.refresh(sample_product)
    assert sample_product.stock == 2


def test_user_order_isolation(
    client, normal_user_token, admin_user, admin_token, sample_product
):
    user_headers = {"Authorization": f"Bearer {normal_user_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Normal user places an order
    client.post(
        "/cart/items",
        json={"product_id": sample_product.id, "quantity": 1},
        headers=user_headers,
    )
    user_order = client.post("/orders/checkout", headers=user_headers).json()

    # Normal user gets orders
    user_orders = client.get("/orders/", headers=user_headers).json()
    assert len(user_orders) == 1
    assert user_orders[0]["id"] == user_order["id"]

    # Admin's personal orders list should be empty
    admin_orders = client.get("/orders/", headers=admin_headers).json()
    assert len(admin_orders) == 0

    # Admin order management endpoint sees all orders
    all_orders = client.get("/orders/admin", headers=admin_headers).json()
    assert any(o["id"] == user_order["id"] for o in all_orders)


def test_order_status_valid_transitions(
    client, normal_user_token, admin_token, sample_product
):
    user_headers = {"Authorization": f"Bearer {normal_user_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Create order: pending
    client.post(
        "/cart/items",
        json={"product_id": sample_product.id, "quantity": 1},
        headers=user_headers,
    )
    order = client.post("/orders/checkout", headers=user_headers).json()
    order_id = order["id"]
    assert order["status"] == "pending"

    # pending -> confirmed
    res_conf = client.put(
        f"/orders/admin/{order_id}/status?status=confirmed", headers=admin_headers
    )
    assert res_conf.status_code == 200
    assert res_conf.json()["status"] == "confirmed"

    # confirmed -> shipped
    res_ship = client.put(
        f"/orders/admin/{order_id}/status?status=shipped", headers=admin_headers
    )
    assert res_ship.status_code == 200
    assert res_ship.json()["status"] == "shipped"

    # shipped -> delivered
    res_deliv = client.put(
        f"/orders/admin/{order_id}/status?status=delivered", headers=admin_headers
    )
    assert res_deliv.status_code == 200
    assert res_deliv.json()["status"] == "delivered"


def test_order_status_cancellation_from_pending(
    client, normal_user_token, admin_token, sample_product
):
    user_headers = {"Authorization": f"Bearer {normal_user_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    client.post(
        "/cart/items",
        json={"product_id": sample_product.id, "quantity": 1},
        headers=user_headers,
    )
    order = client.post("/orders/checkout", headers=user_headers).json()
    order_id = order["id"]

    # pending -> cancelled
    res = client.put(
        f"/orders/admin/{order_id}/status?status=cancelled", headers=admin_headers
    )
    assert res.status_code == 200
    assert res.json()["status"] == "cancelled"


def test_order_status_invalid_transition(
    client, normal_user_token, admin_token, sample_product
):
    user_headers = {"Authorization": f"Bearer {normal_user_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    client.post(
        "/cart/items",
        json={"product_id": sample_product.id, "quantity": 1},
        headers=user_headers,
    )
    order = client.post("/orders/checkout", headers=user_headers).json()
    order_id = order["id"]

    # pending -> delivered (invalid skip!)
    res_skip = client.put(
        f"/orders/admin/{order_id}/status?status=delivered", headers=admin_headers
    )
    assert res_skip.status_code == 400
    assert "Cannot change order status" in res_skip.json()["detail"]

    # Now cancel it
    client.put(f"/orders/admin/{order_id}/status?status=cancelled", headers=admin_headers)

    # cancelled -> confirmed (invalid: final state!)
    res_reopen = client.put(
        f"/orders/admin/{order_id}/status?status=confirmed", headers=admin_headers
    )
    assert res_reopen.status_code == 400
    assert "already cancelled" in res_reopen.json()["detail"]


def test_user_can_cancel_own_order(client, normal_user_token, sample_product, db_session):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    initial_stock = sample_product.stock

    # Create order
    client.post("/cart/items", json={"product_id": sample_product.id, "quantity": 2}, headers=headers)
    order = client.post("/orders/checkout", headers=headers).json()
    order_id = order["id"]
    assert order["status"] == "pending"

    # Stock should be reduced
    db_session.refresh(sample_product)
    assert sample_product.stock == initial_stock - 2

    # User cancels order
    cancel_res = client.post(f"/orders/{order_id}/cancel", headers=headers)
    assert cancel_res.status_code == 200
    cancelled_order = cancel_res.json()
    assert cancelled_order["status"] == "cancelled"

    # Stock should be restored
    db_session.refresh(sample_product)
    assert sample_product.stock == initial_stock


def test_payment_verification_confirms_order(client, normal_user_token, sample_product):
    headers = {"Authorization": f"Bearer {normal_user_token}"}

    client.post("/cart/items", json={"product_id": sample_product.id, "quantity": 1}, headers=headers)
    order = client.post("/orders/checkout", headers=headers).json()
    order_id = order["id"]
    assert order["status"] == "pending"

    # Verify payment
    verify_payload = {
        "razorpay_payment_id": "pay_test_987654321",
        "razorpay_order_id": order.get("razorpay_order_id", "order_rzp_test"),
        "razorpay_signature": "mock_valid_signature"
    }
    verify_res = client.post(f"/orders/{order_id}/verify-payment", json=verify_payload, headers=headers)
    assert verify_res.status_code == 200
    confirmed_order = verify_res.json()
    assert confirmed_order["status"] == "confirmed"
    assert confirmed_order["payment_method"] == "Razorpay"

