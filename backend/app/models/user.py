from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="user")
    is_verified = Column(Boolean, nullable=False, default=False)
    verification_code = Column(String(10), nullable=True)
    verification_code_hash = Column(String(128), nullable=True)
    verification_attempts = Column(Integer, nullable=False, default=0)
    verification_code_sent_at = Column(DateTime, nullable=True)
    verification_code_expires_at = Column(DateTime, nullable=True)
    reset_password_token = Column(String(255), nullable=True, index=True)
    reset_password_expires_at = Column(DateTime, nullable=True)
    token_version = Column(Integer, nullable=False, default=1)

    cart = relationship(
        "Cart",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    orders = relationship(
        "Order",
        back_populates="user",
        cascade="all, delete-orphan"
    )