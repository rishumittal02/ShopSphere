FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies if required
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY alembic.ini .
COPY alembic/ ./alembic/
COPY app/ ./app/
COPY seed_data.py .
COPY wait_for_db.py .
COPY start.sh .
RUN chmod +x start.sh

# Expose backend port
EXPOSE 8000

# Default command
CMD ["./start.sh"]
