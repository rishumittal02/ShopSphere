import os
from dotenv import load_dotenv
from sqlalchemy.engine import URL, make_url

load_dotenv()

raw_url = os.getenv("DATABASE_URL")
if raw_url:
    if raw_url.startswith("mysql://"):
        raw_url = raw_url.replace("mysql://", "mysql+pymysql://", 1)
    DATABASE_URL = make_url(raw_url)
else:
    DATABASE_URL = URL.create(
        drivername="mysql+pymysql",
        username=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASS", ""),
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        database=os.getenv("DB_NAME", "shopsphere")
    )