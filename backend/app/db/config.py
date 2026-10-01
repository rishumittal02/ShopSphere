import os
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    user = os.getenv("DB_USER", "root")
    password = urllib.parse.quote_plus(os.getenv("DB_PASS", ""))
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "3306")
    db_name = os.getenv("DB_NAME", "shopsphere")
    DATABASE_URL = f"mysql+pymysql://{user}:{password}@{host}:{port}/{db_name}"
elif DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)