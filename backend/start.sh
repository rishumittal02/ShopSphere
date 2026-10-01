#!/bin/sh
set -e

echo "Applying database migrations..."
alembic upgrade head

echo "Seeding initial product catalog and categories..."
python seed_data.py || true

echo "Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
