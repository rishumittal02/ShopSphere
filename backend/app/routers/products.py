from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import Literal

from app.db.dependencies import get_db
from app.core.dependencies import require_admin, get_current_user

from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.cart import CartItem
from app.models.order import OrderItem
from app.models.review import Review

from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse
)
from app.schemas.review import (
    ReviewCreate,
    ReviewResponse,
    ReviewSummaryResponse
)


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


# =========================================================
# CREATE PRODUCT — ADMIN ONLY
# =========================================================

@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Clean product name
    product_name = product.name.strip()

    if not product_name:
        raise HTTPException(
            status_code=400,
            detail="Product name cannot be empty"
        )

    # Check whether category exists
    category = (
        db.query(Category)
        .filter(Category.id == product.category_id)
        .first()
    )

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    # Create product
    new_product = Product(
        name=product_name,
        description=product.description,
        price=product.price,
        stock=product.stock,
        category_id=product.category_id
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


# =========================================================
# GET ALL PRODUCTS — PUBLIC
# =========================================================

@router.get("/", response_model=list[ProductResponse])
def get_products(
    search: str | None = None,
    category_id: int | None = None,
    sort: Literal[
        "price_asc",
        "price_desc",
        "name_asc",
        "name_desc"
    ] = "name_asc",
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = (
        db.query(Product)
        .options(
            joinedload(Product.category)
        )
    )

    # -----------------------------------------------------
    # Search
    # -----------------------------------------------------

    if search:
        search = search.strip()

        if search:
            query = query.filter(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.description.ilike(f"%{search}%")
                )
            )

    # -----------------------------------------------------
    # Category filtering
    # -----------------------------------------------------

    if category_id is not None:
        query = query.filter(
            Product.category_id == category_id
        )

    # -----------------------------------------------------
    # Sorting
    # -----------------------------------------------------

    if sort == "price_asc":
        query = query.order_by(
            Product.price.asc()
        )

    elif sort == "price_desc":
        query = query.order_by(
            Product.price.desc()
        )

    elif sort == "name_asc":
        query = query.order_by(
            Product.name.asc()
        )

    elif sort == "name_desc":
        query = query.order_by(
            Product.name.desc()
        )

    # -----------------------------------------------------
    # Pagination
    # -----------------------------------------------------

    products = (
        query
        .offset(skip)
        .limit(limit)
        .all()
    )

    return products


# =========================================================
# GET SINGLE PRODUCT — PUBLIC
# =========================================================

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = (
        db.query(Product)
        .options(
            joinedload(Product.category)
        )
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


# =========================================================
# UPDATE PRODUCT — ADMIN ONLY
# =========================================================

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Find product
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Clean product name
    product_name = product_data.name.strip()

    if not product_name:
        raise HTTPException(
            status_code=400,
            detail="Product name cannot be empty"
        )

    # Check whether category exists
    category = (
        db.query(Category)
        .filter(Category.id == product_data.category_id)
        .first()
    )

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    # Update product
    product.name = product_name
    product.description = product_data.description
    product.price = product_data.price
    product.stock = product_data.stock
    product.category_id = product_data.category_id

    db.commit()
    db.refresh(product)

    return product


# =========================================================
# DELETE PRODUCT — ADMIN ONLY
# =========================================================

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # 1. Check if product is referenced in existing customer orders
    order_count = (
        db.query(OrderItem)
        .filter(OrderItem.product_id == product_id)
        .count()
    )

    if order_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot delete \"{product.name}\" because it is linked to {order_count} past customer order(s). "
                f"To stop selling this product without altering customer order history, please edit the product and set its stock to 0."
            )
        )

    try:
        # 2. Clean up any active carts that have this product
        db.query(CartItem).filter(CartItem.product_id == product_id).delete(synchronize_session=False)

        # 3. Delete the product
        db.delete(product)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot delete \"{product.name}\" because it is referenced by other database records. "
                f"Please update its stock to 0 instead."
            )
        )

    return {
        "message": f"Product '{product.name}' deleted successfully"
    }


# =========================================================
# PRODUCT REVIEWS
# =========================================================

@router.get("/{product_id}/reviews", response_model=ReviewSummaryResponse)
def get_product_reviews(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    reviews = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    total = len(reviews)
    avg_rating = round(sum(r.rating for r in reviews) / total, 1) if total > 0 else 0.0

    return {
        "average_rating": avg_rating,
        "total_reviews": total,
        "reviews": reviews
    }


@router.post("/{product_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_product_review(
    product_id: int,
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Clean comment
    comment_clean = payload.comment.strip()
    if not comment_clean:
        raise HTTPException(
            status_code=400,
            detail="Review comment cannot be empty."
        )

    review = Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=payload.rating,
        comment=comment_clean
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    # Eager load user relationship for response
    review_with_user = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.id == review.id)
        .first()
    )

    return review_with_user