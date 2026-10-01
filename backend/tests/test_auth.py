def test_register_user_success(client):
    payload = {
        "name": "Alice Smith",
        "email": "alice@example.com",
        "password": "securepassword123",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Alice Smith"
    assert data["email"] == "alice@example.com"
    assert data["role"] == "user"
    assert "password" not in data


def test_register_duplicate_email(client, normal_user):
    payload = {
        "name": "Duplicate User",
        "email": normal_user.email,
        "password": "anotherpassword123",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]


def test_register_invalid_email(client):
    payload = {
        "name": "Bad Email User",
        "email": "not-an-email",
        "password": "validpassword123",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


def test_register_weak_password(client):
    payload = {
        "name": "Short Password",
        "email": "short@example.com",
        "password": "short",  # Less than 8 chars
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success(client, normal_user):
    form_data = {
        "username": normal_user.email,
        "password": "password123",
    }
    response = client.post("/auth/login", data=form_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_failure_wrong_password(client, normal_user):
    form_data = {
        "username": normal_user.email,
        "password": "wrongpassword",
    }
    response = client.post("/auth/login", data=form_data)
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_login_failure_nonexistent_user(client):
    form_data = {
        "username": "nobody@example.com",
        "password": "somepassword",
    }
    response = client.post("/auth/login", data=form_data)
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_auth_me_success(client, normal_user, normal_user_token):
    headers = {"Authorization": f"Bearer {normal_user_token}"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == normal_user.id
    assert data["email"] == normal_user.email
    assert data["name"] == normal_user.name
    assert "password" not in data


def test_auth_me_missing_jwt(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_auth_me_invalid_jwt(client):
    headers = {"Authorization": "Bearer invalid.token.value"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 401
