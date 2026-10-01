import os
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = (
    os.getenv("DATABASE_URL")
    or os.getenv("MYSQL_URL")
    or os.getenv("MYSQL_PRIVATE_URL")
    or os.getenv("MYSQL_PUBLIC_URL")
    or os.getenv("MYSQLDATABASEURL")
    or os.getenv("MYSQL_URL_PRIVATE")
    or os.getenv("DATABASE_PUBLIC_URL")
)

if not DATABASE_URL:
    user = os.getenv("DB_USER") or os.getenv("MYSQLUSER") or os.getenv("MYSQL_USER") or "root"
    raw_pass = os.getenv("DB_PASS") or os.getenv("MYSQLPASSWORD") or os.getenv("MYSQL_PASSWORD") or ""
    password = urllib.parse.quote_plus(raw_pass)
    host = os.getenv("DB_HOST") or os.getenv("MYSQLHOST") or os.getenv("MYSQL_HOST") or "localhost"
    port = os.getenv("DB_PORT") or os.getenv("MYSQLPORT") or os.getenv("MYSQL_PORT") or "3306"
    db_name = os.getenv("DB_NAME") or os.getenv("MYSQLDATABASE") or os.getenv("MYSQL_DATABASE") or "shopsphere"
    DATABASE_URL = f"mysql+pymysql://{user}:{password}@{host}:{port}/{db_name}"
elif DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)