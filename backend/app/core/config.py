import os

from dotenv import load_dotenv


load_dotenv()


SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "807ae2a2a46b3fef2a3fd3843584db83a2a8389f6335c86ef3a868abb642f27c"
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