# ----------- BUILD STAGE -----------
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt \
    && find /venv -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true \
    && find /venv -name "*.pyc" -delete \
    && find /venv -name "*.pyo" -delete

# ----------- RUNTIME STAGE -----------
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/venv/bin:$PATH" \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

COPY --from=builder /venv /venv

# Copy app code
COPY . .

# 🔥 IMPORTANT: DB folder + permission fix
RUN mkdir -p /app/db \
    && chown -R nobody:nogroup /app

# Fix entrypoint
RUN chmod +x /app/entrypoint.sh

USER nobody

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]