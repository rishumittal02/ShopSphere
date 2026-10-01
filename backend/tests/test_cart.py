def test_get_cart_auto_created(client, normal_user_token):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = client.get("/cart/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) == 0


def test_add_cart_item_success(client, normal_user_token, sample_product):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    payload = {
        "product_id": sample_product.id,
        "quantity": 2,
    }
    response = client.post("/cart/items", json=payload, headers=headers)
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["product_id"] == sample_product.id
    assert items[0]["quantity"] == 2


def test_add_cart_item_invalid_product(client, normal_user_token):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    payload = {
        "product_id": 999999,
        "quantity": 1,
    }
    response = client.post("/cart/items", json=payload, headers=headers)
    assert response.status_code == 404
    assert "Product not found" in response.json()["detail"]


def test_add_cart_item_insufficient_stock(client, normal_user_token, sample_product):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    payload = {
        "product_id": sample_product.id,
        "quantity": sample_product.stock + 10,
    }
    response = client.post("/cart/items", json=payload, headers=headers)
    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["detail"]


def test_update_cart_quantity_success(client, normal_user_token, sample_product):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    # Add initial 2 items
    client.post(
        "/cart/items",
        json={"product_id": sample_product.id, "quantity": 2},
        headers=headers,
    )

    # Update to 4
    response = client.put(
        f"/cart/items/{sample_product.id}",
        json={"quantity": 4},
        headers=headers,
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert items[0]["quantity"] == 4


def test_remove_cart_item(client, normal_user_token, sample_product):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    client.post(
        "/cart/items",
        json={"product_id": sample_product.id, "quantity": 1},
        headers=headers,
    )

    response = client.delete(f"/cart/items/{sample_product.id}", headers=headers)
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 0


def test_clear_cart(client, normal_user_token, sample_product):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    client.post(
        "/cart/items",
        json={"product_id": sample_product.id, "quantity": 3},
        headers=headers,
    )

    response = client.delete("/cart/", headers=headers)
    assert response.status_code == 200
    assert "cleared successfully" in response.json()["message"]

    # Verify cart is empty
    cart_check = client.get("/cart/", headers=headers)
    assert len(cart_check.json()["items"]) == 0
