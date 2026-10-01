from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from typing import Literal

from app.db.dependencies import get_db
from app.core.dependencies import require_admin

from app.models.user import User
from app.models.product import Product
from app.models.category import Category

from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse
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
    limit: int = Query(10, ge=1, le=100),
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

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully"
    }