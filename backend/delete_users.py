import os
import sys

# Ensure backend root is in sys.path
backend_path = os.path.dirname(os.path.abspath(__file__))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.db.base import SessionLocal
from app.models.user import User

# Emails can be provided via CLI args (e.g. python delete_users.py email1 email2) or fallback list
EMAILS_TO_DELETE = sys.argv[1:] if len(sys.argv) > 1 else [
    "rishumittal.work@gmail.com",
    "fanssting@gmail.com",
    "rishumittalcu@gmail.com",
]

def delete_users():
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.email.in_(EMAILS_TO_DELETE)).all()
        if not users:
            print("No matching users found for emails:", EMAILS_TO_DELETE)
            return

        print(f"Found {len(users)} user(s) to delete:")
        for user in users:
            print(f" - {user.email} (ID: {user.id}, Role: {user.role})")
            db.delete(user)

        db.commit()
        print(f"\nSuccessfully deleted {len(users)} user(s) and their cascading data (cart, orders, etc.).")
    except Exception as e:
        db.rollback()
        print(f"Error deleting users: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    delete_users()
