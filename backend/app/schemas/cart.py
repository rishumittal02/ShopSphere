from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class CartItemCreate(BaseModel):
    product_id: int = Field(
        gt=0
    )

    quantity: int = Field(
        gt=0
    )


class CartItemUpdate(BaseModel):
    quantity: int = Field(
        gt=0
    )


class CartProductResponse(BaseModel):
    id: int
    name: str
    price: Decimal

    model_config = ConfigDict(
        from_attributes=True
    )


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: CartProductResponse

    model_config = ConfigDict(
        from_attributes=True
    )


class CartResponse(BaseModel):
    id: int
    user_id: int
    items: list[CartItemResponse]
    total_amount: Decimal = Decimal("0.00")

    model_config = ConfigDict(
        from_attributes=True
    )