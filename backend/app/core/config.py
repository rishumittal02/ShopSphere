import os

from dotenv import load_dotenv


load_dotenv(override=True)


ENVIRONMENT = os.getenv("ENVIRONMENT", os.getenv("APP_ENV", "development")).lower()
IS_PRODUCTION = ENVIRONMENT == "production"

DEFAULT_INSECURE_SECRET = "807ae2a2a46b3fef2a3fd3843584db83a2a8389f6335c86ef3a868abb642f27c"
SECRET_KEY = os.getenv("SECRET_KEY", DEFAULT_INSECURE_SECRET)

if IS_PRODUCTION:
    if not SECRET_KEY or SECRET_KEY == DEFAULT_INSECURE_SECRET:
        raise RuntimeError(
            "FATAL: Production environment requires a securely generated SECRET_KEY. "
            "Using default development secret in production is prohibited."
        )

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "30"
    )
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000"
)

# Email / SMTP Configuration
SMTP_USER = (
    os.getenv("SMTP_USER")
    or os.getenv("SMTP_USERNAME")
    or os.getenv("MAIL_USER")
    or os.getenv("MAIL_USERNAME")
    or os.getenv("EMAIL_USER")
    or os.getenv("SMTP_FROM_EMAIL")
    or ""
).strip().strip('"').strip("'")

SMTP_HOST = (
    os.getenv("SMTP_HOST")
    or os.getenv("MAIL_HOST")
    or os.getenv("EMAIL_HOST")
    or ("smtp.gmail.com" if "gmail.com" in SMTP_USER.lower() else "")
).strip().strip('"').strip("'")

SMTP_PORT = int(os.getenv("SMTP_PORT") or os.getenv("MAIL_PORT") or "587")

SMTP_PASSWORD = (
    os.getenv("SMTP_PASSWORD")
    or os.getenv("SMTP_PASS")
    or os.getenv("MAIL_PASSWORD")
    or os.getenv("MAIL_PASS")
    or os.getenv("EMAIL_PASSWORD")
    or os.getenv("EMAIL_PASS")
    or os.getenv("GMAIL_APP_PASSWORD")
    or os.getenv("GMAIL_PASSWORD")
    or ""
).strip().strip('"').strip("'")

SMTP_FROM_EMAIL = (
    os.getenv("SMTP_FROM_EMAIL")
    or os.getenv("MAIL_FROM")
    or os.getenv("EMAIL_FROM")
    or SMTP_USER
    or "noreply@shopsphere.in"
).strip().strip('"').strip("'")

SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "ShopSphere")

# HTTPS Email APIs (bypasses Railway SMTP port blocks)
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip().strip('"').strip("'")
BREVO_API_KEY = (os.getenv("BREVO_API_KEY") or os.getenv("SENDINBLUE_API_KEY") or "").strip().strip('"').strip("'")

# Razorpay Configuration
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_shopsphere2026")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "mock_secret_key_123")
RAZORPAY_IS_DEMO = (
    not RAZORPAY_KEY_ID
    or RAZORPAY_KEY_ID.startswith("rzp_test_")
    or RAZORPAY_KEY_SECRET == "mock_secret_key_123"
)

if IS_PRODUCTION and RAZORPAY_IS_DEMO:
    # In production, warn if using test credentials
    import logging
    logging.getLogger(__name__).warning(
        "ShopSphere is operating with TEST/MOCK Razorpay credentials in production mode."
    )