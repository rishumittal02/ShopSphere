from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=200
    )

    description: str | None = None

    price: Decimal = Field(
        gt=0
    )

    stock: int = Field(
        ge=0
    )

    category_id: int = Field(
        gt=0
    )


class ProductUpdate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=200
    )

    description: str | None = None

    price: Decimal = Field(
        gt=0
    )

    stock: int = Field(
        ge=0
    )

    category_id: int = Field(
        gt=0
    )


class CategoryResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(
        from_attributes=True
    )


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    price: Decimal
    stock: int
    category_id: int
    category: CategoryResponse

    model_config = ConfigDict(
        from_attributes=True
    )