from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.core.dependencies import require_admin

from app.models.user import User
from app.models.category import Category
from app.models.product import Product

from app.schemas.category import (
    CategoryCreate,
    CategoryResponse
)


router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


# =========================================================
# GET ALL CATEGORIES — PUBLIC
# =========================================================

@router.get("/", response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db)
):
    categories = (
        db.query(Category)
        .all()
    )

    return categories


# =========================================================
# CREATE CATEGORY — ADMIN ONLY
# =========================================================

@router.post("/", response_model=CategoryResponse)
def create_category(
    category: CategoryCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Remove leading/trailing spaces
    category_name = category.name.strip()

    # Prevent empty/whitespace-only names
    if not category_name:
        raise HTTPException(
            status_code=400,
            detail="Category name cannot be empty"
        )

    # Check for duplicate category
    existing_category = (
        db.query(Category)
        .filter(Category.name == category_name)
        .first()
    )

    if existing_category:
        raise HTTPException(
            status_code=400,
            detail="Category already exists"
        )

    # Create category
    new_category = Category(
        name=category_name
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


# =========================================================
# UPDATE CATEGORY — ADMIN ONLY
# =========================================================

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_data: CategoryCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Find category
    category = (
        db.query(Category)
        .filter(Category.id == category_id)
        .first()
    )

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    # Remove leading/trailing spaces
    category_name = category_data.name.strip()

    # Prevent empty/whitespace-only names
    if not category_name:
        raise HTTPException(
            status_code=400,
            detail="Category name cannot be empty"
        )

    # Check duplicate name
    existing_category = (
        db.query(Category)
        .filter(
            Category.name == category_name,
            Category.id != category_id
        )
        .first()
    )

    if existing_category:
        raise HTTPException(
            status_code=400,
            detail="Category already exists"
        )

    # Save cleaned name
    category.name = category_name

    db.commit()
    db.refresh(category)

    return category


# =========================================================
# DELETE CATEGORY — ADMIN ONLY
# =========================================================

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Find category
    category = (
        db.query(Category)
        .filter(Category.id == category_id)
        .first()
    )

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    # Check whether products use this category
    product_count = (
        db.query(Product)
        .filter(Product.category_id == category_id)
        .count()
    )

    if product_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot delete category because "
                f"{product_count} product(s) belong to this category"
            )
        )

    # Delete category
    db.delete(category)
    db.commit()

    return {
        "message": "Category deleted successfully"
    }