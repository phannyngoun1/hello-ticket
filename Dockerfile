# ---- Frontend build ----
FROM node:20-alpine AS frontend-build
WORKDIR /app

# Copy frontend (node_modules excluded via .dockerignore)
COPY frontend/ /app/frontend/

# Install and build (same-origin API for combined deploy)
WORKDIR /app/frontend
RUN npm ci 2>/dev/null || npm install
ENV VITE_API_BASE_URL=
RUN npm run build

# ---- Backend + serve frontend ----
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/
COPY tools/ tools/
COPY --from=frontend-build /app/frontend/apps/web/dist /app/frontend_dist

ENV FRONTEND_DIST_DIR=/app/frontend_dist
ENV PYTHONPATH=/app/backend
ENV PORT=8000

WORKDIR /app
EXPOSE 8000

# Run migrations then start the app. Railway Release Command can also run migrations before deploy.
# Railway sets PORT at runtime; use it so the app listens on the right port.
CMD ["sh", "-c", "python tools/migrate-db.py upgrade && cd /app/backend && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
