from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal


class OrderUserResponse(BaseModel):
    id: int
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class OrderProductResponse(BaseModel):
    id: int
    name: str
    price: Decimal

    model_config = ConfigDict(from_attributes=True)


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: Decimal
    product: OrderProductResponse

    model_config = ConfigDict(from_attributes=True)


class CheckoutRequest(BaseModel):
    payment_method: str | None = "Razorpay"


class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str | None = None
    razorpay_signature: str | None = None


class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: Decimal
    status: str
    payment_method: str | None = "Razorpay"
    payment_id: str | None = None
    razorpay_order_id: str | None = None
    created_at: datetime

    user: OrderUserResponse
    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)