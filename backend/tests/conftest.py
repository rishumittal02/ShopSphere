import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from passlib.context import CryptContext

from app.main import app
from app.db.base import Base
from app.db.dependencies import get_db
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem
from app.core.security import create_access_token

# Isolated SQLite in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test function."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def normal_user(db_session):
    """Fixture to create a regular user."""
    user = User(
        name="John Doe",
        email="john@example.com",
        password=pwd_context.hash("password123"),
        role="user",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def normal_user_token(normal_user):
    """Access token for the normal user."""
    return create_access_token(normal_user.id)


@pytest.fixture
def admin_user(db_session):
    """Fixture to create an admin user."""
    admin = User(
        name="Admin Boss",
        email="admin@example.com",
        password=pwd_context.hash("adminpassword123"),
        role="admin",
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def admin_token(admin_user):
    """Access token for the admin user."""
    return create_access_token(admin_user.id)


@pytest.fixture
def sample_category(db_session):
    """Fixture to create a sample product category."""
    cat = Category(name="Electronics")
    db_session.add(cat)
    db_session.commit()
    db_session.refresh(cat)
    return cat


@pytest.fixture
def sample_product(db_session, sample_category):
    """Fixture to create a sample product."""
    product = Product(
        name="Smartphone X",
        description="High-end smartphone with OLED screen",
        price=799.99,
        stock=10,
        category_id=sample_category.id,
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product
