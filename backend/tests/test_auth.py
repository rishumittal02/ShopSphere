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


def test_registration_email_verification_flow(client, db_session):
    from app.models.user import User

    payload = {
        "name": "Unverified Bob",
        "email": "bob@example.com",
        "password": "bobpassword123",
    }
    reg_res = client.post("/auth/register", json=payload)
    assert reg_res.status_code == 200

    # User cannot log in before verifying email
    login_attempt = client.post(
        "/auth/login",
        data={"username": "bob@example.com", "password": "bobpassword123"}
    )
    assert login_attempt.status_code == 403
    assert "Email not verified" in login_attempt.json()["detail"]

    # Retrieve verification code from DB
    user = db_session.query(User).filter(User.email == "bob@example.com").first()
    assert user.is_verified is False
    assert user.verification_code is not None

    # Verify email with code
    verify_res = client.post(
        "/auth/verify-email",
        json={"email": "bob@example.com", "code": user.verification_code}
    )
    assert verify_res.status_code == 200
    assert "access_token" in verify_res.json()

    # Now login succeeds
    login_success = client.post(
        "/auth/login",
        data={"username": "bob@example.com", "password": "bobpassword123"}
    )
    assert login_success.status_code == 200
    assert "access_token" in login_success.json()


def test_password_reset_flow(client, normal_user, db_session):
    from app.models.user import User

    # Request password reset
    forgot_res = client.post("/auth/forgot-password", json={"email": normal_user.email})
    assert forgot_res.status_code == 200

    # Retrieve token
    db_session.refresh(normal_user)
    assert normal_user.reset_password_token is not None

    # Reset password
    reset_res = client.post(
        "/auth/reset-password",
        json={"token": normal_user.reset_password_token, "new_password": "brandnewpassword999"}
    )
    assert reset_res.status_code == 200

    # Log in with new password
    login_res = client.post(
        "/auth/login",
        data={"username": normal_user.email, "password": "brandnewpassword999"}
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()


def test_reregister_unverified_user_succeeds(client, db_session):
    from app.models.user import User

    # 1. Register first time
    payload = {
        "name": "Unverified Carol",
        "email": "carol@example.com",
        "password": "initialpassword123",
    }
    res1 = client.post("/auth/register", json=payload)
    assert res1.status_code == 200
    user1 = db_session.query(User).filter(User.email == "carol@example.com").first()
    code1 = user1.verification_code

    # 2. Re-register with same email while unverified
    payload2 = {
        "name": "Carol Updated",
        "email": "carol@example.com",
        "password": "newpassword12345",
    }
    res2 = client.post("/auth/register", json=payload2)
    assert res2.status_code == 200
    db_session.refresh(user1)
    assert user1.name == "Carol Updated"
    assert user1.verification_code != code1  # Fresh code generated

    # 3. Verify with the new code
    verify_res = client.post(
        "/auth/verify-email",
        json={"email": "carol@example.com", "code": user1.verification_code}
    )
    assert verify_res.status_code == 200

