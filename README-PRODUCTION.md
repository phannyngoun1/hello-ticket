# Hello Ticket – Production Deployment

This guide covers running Hello Ticket in production: combined backend + frontend, and deploying on Railway.

---

## Combined backend + frontend (single process)

The backend can serve the built React app so you run one process (API + SPA on the same host).

### 1. Build the frontend (same-origin API)

So the app calls the same host (no CORS, no separate API URL):

```bash
cd frontend
npm install
VITE_API_BASE_URL= npm run build
```

### 2. Run the backend (with DB)

From project root, with PostgreSQL running:

```bash
./start.sh   # if not already
cd backend
source venv/bin/activate   # Windows: venv\Scripts\activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The backend detects `frontend/apps/web/dist` and serves:

- **SPA** at `/`
- **Assets** at `/assets`
- **API** at `/api/v1`, **docs** at `/docs`

**Override frontend path:** set `FRONTEND_DIST_DIR` in `backend/.env` (e.g. in Docker: `FRONTEND_DIST_DIR=/app/frontend_dist`).

---

## Deploy on Railway

The repo includes a root **Dockerfile** that builds the frontend and runs the backend in one image.

### 1. Create project and connect repo

- [Railway](https://railway.app) → **New Project** → **Deploy from GitHub** → select this repo.

### 2. Add PostgreSQL

- In the project → **New** → **Database** → **PostgreSQL**.
- Link the database to your app service so Railway sets `DATABASE_URL`.

### 3. Configure the app service

- **Settings → Build**
  - Builder: **Dockerfile**
  - Dockerfile path: **Dockerfile** (root of repo).

- **Variables** (add these; Railway sets `DATABASE_URL` when Postgres is linked):

  | Variable           | Value |
  |--------------------|--------|
  | `ENVIRONMENT`      | `production` |
  | `SECRET_KEY`       | Long random secret (e.g. `python -c "import secrets; print(secrets.token_urlsafe(32))"`) |
  | `ALLOWED_ORIGINS`  | `https://<your-app>.up.railway.app` (or your custom domain) |

- **Settings → Deploy → Release Command** (optional but recommended if you use migrations):

  ```bash
  python tools/migrate-db.py upgrade
  ```

  Runs Alembic migrations before each deploy. Tables are also created automatically on app startup (see “Database schema on Railway” below); use this when you have migration files for schema changes.

### 4. Deploy

After deploy:

- **App:** `https://<your-service>.up.railway.app`
- **API docs:** `https://<your-service>.up.railway.app/docs`

Railway sets `PORT`; the Dockerfile uses it so the app listens on the correct port.

### Optional production variables

From `backend/env.example` you may also set:

- `DEFAULT_TENANT_ID` – e.g. `default-tenant`
- `DEFAULT_ADMIN_USERNAME`, `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_ADMIN_NAME` – if you use the built-in admin creation (change password after first login).
- `CACHE_BACKEND` – `disk` or `redis` (if you add Redis).
- `REQUIRE_TENANT` – `true` in production if you want to require tenant headers.

---

## Database schema on Railway

**Fresh deploy:** If you see migration errors (e.g. "relation X does not exist"), reset the database once, then redeploy:

```bash
DATABASE_URL="<your-railway-postgres-url>" python tools/reset-db.py
```

Then deploy again. Migrations run before uvicorn in the Docker CMD.

**Normal operation:** Migrations run before uvicorn (Dockerfile CMD). One initial migration creates all tables. The backend runs `create_db_and_tables()` and `create_platform_db_and_tables()` on startup (see `backend/app/startup.py`). So on first deploy, once the app starts and connects to PostgreSQL, all tables are created from the current models. You do **not** create the schema in the Railway PostgreSQL dashboard.

**Two ways the schema is managed:**

1. **On startup (automatic)**  
   When the app boots, it creates any missing tables from the Python models (`operational_metadata.create_all(engine, checkfirst=True)` and platform metadata). So the initial schema is created without running any migration command.

2. **Migrations (optional but recommended for changes)**  
   Use the **Release Command** `python tools/migrate-db.py upgrade` when you have Alembic migrations (e.g. after adding a column or index via a migration). That runs before each deploy and applies pending migrations. For a brand‑new DB with no migrations, you can omit the Release Command and rely on startup; for ongoing schema changes, keep the Release Command.

**Summary:** You don’t need to “create the DB schema” manually. Link Postgres, set `DATABASE_URL`, and start the app – tables are created on first start. Use the Release Command if you use migrations for schema evolution.

---

## Production checklist

| Item | Action |
|------|--------|
| **DATABASE_URL** | Set by Railway when Postgres is linked. |
| **PORT** | Set by Railway; Dockerfile uses it. |
| **SECRET_KEY** | Set in Variables (strong, random). |
| **ENVIRONMENT** | `production`. |
| **ALLOWED_ORIGINS** | Your app URL (no trailing slash). |
| **Schema** | Migrations and tables created automatically on app startup. |
| **Admin password** | Set `DEFAULT_ADMIN_PASSWORD` and change after first login. |

---

## Environment modes

With `ENVIRONMENT=production`:

- CORS uses `ALLOWED_ORIGINS` (no `*`).
- Strict checks on insecure config.
- Console logs stripped in frontend build.
- Generic error messages to clients.

See [SECURITY_IMPROVEMENTS.md](./SECURITY_IMPROVEMENTS.md) for details.
