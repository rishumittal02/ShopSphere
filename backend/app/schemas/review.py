from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class ReviewCreate(BaseModel):
    rating: int = Field(
        ge=1,
        le=5,
        description="Rating from 1 to 5 stars"
    )
    comment: str = Field(
        min_length=3,
        max_length=1000,
        description="Review comment text"
    )


class ReviewUserResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    rating: int
    comment: str
    created_at: datetime
    user: ReviewUserResponse

    model_config = ConfigDict(from_attributes=True)


class ReviewSummaryResponse(BaseModel):
    average_rating: float
    total_reviews: int
    reviews: list[ReviewResponse]

    model_config = ConfigDict(from_attributes=True)
