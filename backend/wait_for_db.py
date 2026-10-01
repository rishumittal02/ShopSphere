import os
import sys
import time
from sqlalchemy import create_engine
from app.db.config import DATABASE_URL

def wait_for_db(max_retries=15, delay=2):
    # Mask password for display in logs
    masked_url = str(DATABASE_URL)
    if "@" in masked_url:
        try:
            proto_user, host_db = masked_url.split("@", 1)
            if ":" in proto_user:
                parts = proto_user.split(":")
                masked_url = f"{parts[0]}:{parts[1]}:****@{host_db}"
        except Exception:
            masked_url = "***"

    print(f"Connecting to database at: {masked_url}...")

    # Helpful warning for Railway deployments missing variables
    is_railway = bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_SERVICE_ID"))
    if is_railway and ("localhost" in str(DATABASE_URL) or "127.0.0.1" in str(DATABASE_URL)):
        print("\n" + "=" * 65)
        print("[!] RAILWAY CONFIGURATION WARNING:")
        print("    Your Railway backend is trying to connect to 'localhost'!")
        print("    Railway runs each service in separate containers.")
        print("    In Railway: Go to your Backend service -> 'Variables' tab")
        print("    Add: DATABASE_URL=${{MySQL.DATABASE_URL}}")
        print("=" * 65 + "\n")

    for attempt in range(1, max_retries + 1):
        try:
            engine = create_engine(DATABASE_URL, pool_pre_ping=True)
            with engine.connect() as conn:
                print("Database connection established successfully!")
                return True
        except Exception as exc:
            print(f"Waiting for database to be ready (attempt {attempt}/{max_retries})...")
            if attempt == max_retries:
                print(f"\n[!] Failed to connect to database: {exc}")
                return False
            time.sleep(delay)
    return False

if __name__ == "__main__":
    if not wait_for_db():
        sys.exit(1)
