def test_normal_user_denied_admin_category_create(client, normal_user_token):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    payload = {"name": "Unauthorized Category"}
    response = client.post("/categories/", json=payload, headers=headers)
    assert response.status_code == 403
    assert "Admin access required" in response.json()["detail"]


def test_normal_user_denied_admin_product_create(client, normal_user_token, sample_category):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    payload = {
        "name": "Unauthorized Phone",
        "description": "Desc",
        "price": 499.99,
        "stock": 5,
        "category_id": sample_category.id,
    }
    response = client.post("/products/", json=payload, headers=headers)
    assert response.status_code == 403
    assert "Admin access required" in response.json()["detail"]


def test_normal_user_denied_admin_orders_list(client, normal_user_token):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = client.get("/orders/admin", headers=headers)
    assert response.status_code == 403
    assert "Admin access required" in response.json()["detail"]


def test_admin_allowed_admin_endpoint(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {"name": "Admin Authorized Category"}
    response = client.post("/categories/", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Admin Authorized Category"
