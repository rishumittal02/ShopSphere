def test_get_categories_public(client, sample_category):
    response = client.get("/categories/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(c["id"] == sample_category.id for c in data)


def test_create_category_success(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/categories/", json={"name": "Books"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Books"


def test_create_category_duplicate(client, admin_token, sample_category):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/categories/", json={"name": sample_category.name}, headers=headers)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_update_category_success(client, admin_token, sample_category):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.put(
        f"/categories/{sample_category.id}",
        json={"name": "Consumer Electronics"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Consumer Electronics"


def test_delete_category_prevented_when_products_exist(
    client, admin_token, sample_category, sample_product
):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.delete(f"/categories/{sample_category.id}", headers=headers)
    assert response.status_code == 400
    assert "Cannot delete category" in response.json()["detail"]


def test_delete_category_success(client, admin_token, db_session):
    from app.models.category import Category

    empty_cat = Category(name="Empty Category")
    db_session.add(empty_cat)
    db_session.commit()
    db_session.refresh(empty_cat)

    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.delete(f"/categories/{empty_cat.id}", headers=headers)
    assert response.status_code == 200
    assert "deleted successfully" in response.json()["message"]
