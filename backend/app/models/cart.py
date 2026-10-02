from decimal import Decimal
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    user = relationship("User", back_populates="cart")

    items = relationship(
        "CartItem",
        back_populates="cart",
        cascade="all, delete-orphan"
    )

    @property
    def total_amount(self) -> Decimal:
        if not self.items:
            return Decimal("0.00")
        return sum(
            (Decimal(str(item.product.price)) if item.product and item.product.price is not None else Decimal("0.00")) * item.quantity
            for item in self.items
        )


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)

    cart_id = Column(
        Integer,
        ForeignKey("carts.id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False,
        default=1
    )

    cart = relationship("Cart", back_populates="items")

    product = relationship("Product")