from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session, joinedload

from app.db.dependencies import get_db
from app.core.dependencies import get_current_user, require_admin

from app.models.user import User
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.order import Order, OrderItem

from app.schemas.order import OrderResponse, CheckoutRequest


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


# =========================================================
# CHECKOUT
# =========================================================

@router.post("/checkout", response_model=OrderResponse)
def checkout(
    payload: Optional[CheckoutRequest] = Body(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment_method = payload.payment_method if (payload and payload.payment_method) else "UPI"
    try:
        cart = (
            db.query(Cart)
            .options(
                joinedload(Cart.items)
                .joinedload(CartItem.product)
            )
            .filter(Cart.user_id == current_user.id)
            .first()
        )

        if cart is None or not cart.items:
            raise HTTPException(
                status_code=400,
                detail="Cart is empty"
            )

        # Lock product rows during checkout
        product_ids = [
            item.product_id
            for item in cart.items
        ]

        locked_products = (
            db.query(Product)
            .filter(Product.id.in_(product_ids))
            .with_for_update()
            .all()
        )

        products_by_id = {
            product.id: product
            for product in locked_products
        }

        # Validate stock and calculate total
        total_amount = 0

        for item in cart.items:
            product = products_by_id.get(item.product_id)

            if product is None:
                raise HTTPException(
                    status_code=400,
                    detail="Product not found"
                )

            if item.quantity > product.stock:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.name}"
                )

            total_amount += product.price * item.quantity

        # Create order
        new_order = Order(
            user_id=current_user.id,
            total_amount=total_amount,
            status="pending",
            payment_method=payment_method
        )

        db.add(new_order)

        # Generate order ID
        db.flush()

        # Create order items and reduce stock
        for item in cart.items:
            product = products_by_id[item.product_id]

            order_item = OrderItem(
                order_id=new_order.id,
                product_id=product.id,
                quantity=item.quantity,
                price=product.price
            )

            db.add(order_item)

            product.stock -= item.quantity

        # Remove cart items
        for item in cart.items:
            db.delete(item)

        # Commit everything together
        db.commit()

        # Fetch the completed order with
        # customer + products
        order = (
            db.query(Order)
            .options(
                joinedload(Order.user),
                joinedload(Order.items)
                .joinedload(OrderItem.product)
            )
            .filter(Order.id == new_order.id)
            .first()
        )

        return order

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Checkout failed"
        )


# =========================================================
# GET MY ORDERS
# =========================================================

@router.get("/", response_model=list[OrderResponse])
def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.user),
            joinedload(Order.items)
            .joinedload(OrderItem.product)
        )
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )

    return orders


# =========================================================
# ADMIN - GET ALL ORDERS
# =========================================================

@router.get("/admin", response_model=list[OrderResponse])
def get_all_orders(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.user),
            joinedload(Order.items)
            .joinedload(OrderItem.product)
        )
        .order_by(Order.created_at.desc())
        .all()
    )

    return orders


# =========================================================
# ADMIN - UPDATE ORDER STATUS
# =========================================================

@router.put("/admin/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    order = (
        db.query(Order)
        .options(
            joinedload(Order.user),
            joinedload(Order.items)
            .joinedload(OrderItem.product)
        )
        .filter(Order.id == order_id)
        .first()
    )

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    allowed_statuses = {
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled"
    }

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid order status"
        )

    # Prevent changes to completed orders
    if order.status in {"delivered", "cancelled"}:
        raise HTTPException(
            status_code=400,
            detail=f"Order is already {order.status} and cannot be changed"
        )

    # Define valid status transitions
    valid_transitions = {
        "pending": {"confirmed", "cancelled"},
        "confirmed": {"shipped", "cancelled"},
        "shipped": {"delivered"}
    }

    allowed_next_statuses = valid_transitions.get(
        order.status,
        set()
    )

    if status not in allowed_next_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot change order status "
                f"from {order.status} to {status}"
            )
        )

    order.status = status

    db.commit()
    db.refresh(order)

    return order