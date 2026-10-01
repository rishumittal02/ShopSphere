from fastapi import FastAPI

from app.routers.products import router as product_router
from app.routers.categories import router as category_router
from app.routers.auth import router as auth_router
from app.routers.cart import router as cart_router
from app.routers.orders import router as order_router
from app.core.exceptions import global_exception_handler
from app.core.logging import setup_logging
from app.core.config import FRONTEND_URL


from fastapi.middleware.cors import CORSMiddleware

setup_logging()

app = FastAPI(title="ShopSphere API")

app.add_exception_handler(Exception, global_exception_handler)

allowed_origins = list(dict.fromkeys([
    FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(product_router)
app.include_router(category_router)
app.include_router(auth_router)
app.include_router(cart_router)
app.include_router(order_router)

@app.get("/")
def home():
    return {
        "message": "Welcome to ShopSphere API"
    }