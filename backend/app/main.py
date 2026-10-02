from fastapi import FastAPI

from app.routers.products import router as product_router
from app.routers.categories import router as category_router
from app.routers.auth import router as auth_router
from app.routers.cart import router as cart_router
from app.routers.orders import router as order_router
from sqlalchemy.exc import IntegrityError
from app.core.exceptions import global_exception_handler, integrity_exception_handler
from app.core.logging import setup_logging
from app.core.config import FRONTEND_URL


from fastapi.middleware.cors import CORSMiddleware

setup_logging()

app = FastAPI(title="ShopSphere API")

app.add_exception_handler(IntegrityError, integrity_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

frontend_origins = [url.strip() for url in (FRONTEND_URL or "").split(",") if url.strip()]

allowed_origins = list(dict.fromkeys(frontend_origins + [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
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


@app.get("/health")
def health_check():
    from app.core.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, ENVIRONMENT
    return {
        "status": "healthy",
        "service": "ShopSphere API",
        "version": "1.0.0",
        "smtp": {
            "configured": bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD),
            "host": SMTP_HOST or None,
            "port": SMTP_PORT,
            "user": SMTP_USER or None,
            "has_password": bool(SMTP_PASSWORD),
            "password_len": len(SMTP_PASSWORD) if SMTP_PASSWORD else 0,
        }
    }


@app.get("/test-smtp")
def test_smtp_endpoint(email: str = "rishumittal.work@gmail.com"):
    import traceback
    try:
        from app.services.email import send_verification_email
        ok = send_verification_email(email, "112233", "Diagnostic Test")
        return {"success": ok, "target": email}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}