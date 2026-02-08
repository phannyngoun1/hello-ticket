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

- **Settings → Deploy → Release Command**

  ```bash
  python tools/migrate-db.py upgrade
  ```

  This **creates and updates the database schema** (tables) before each deploy. On first deploy it runs all migrations and creates the schema; on later deploys it applies any new migrations.

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

The schema (tables) is created and updated by **Alembic migrations**, not by creating a DB in the Railway UI.

1. **Automatic (recommended):** Set the **Release Command** to `python tools/migrate-db.py upgrade` (see above). Railway runs it after each build, before the app starts. First deploy = full schema creation; later deploys = new migrations only.

2. **Manual (one-off):** If you need to run migrations by hand (e.g. from Railway’s shell or a one-off job):
   - Open your service → **Settings** or **Deployments** → run a command, or use **Railway CLI** and run inside the container:
   - `python tools/migrate-db.py upgrade`
   - Ensure `DATABASE_URL` is set (it is when Postgres is linked).

3. **No migrations yet:** If the repo has no migration files, generate and apply the initial migration locally, commit, then redeploy so the Release Command can run it:
   - From project root: `python tools/migrate-db.py create-initial` then `python tools/migrate-db.py upgrade`, commit the new file in `backend/alembic/versions/`, push and redeploy.

You do **not** create the schema in the Railway PostgreSQL dashboard; the app creates it via migrations.

---

## Production checklist

| Item | Action |
|------|--------|
| **DATABASE_URL** | Set by Railway when Postgres is linked. |
| **PORT** | Set by Railway; Dockerfile uses it. |
| **SECRET_KEY** | Set in Variables (strong, random). |
| **ENVIRONMENT** | `production`. |
| **ALLOWED_ORIGINS** | Your app URL (no trailing slash). |
| **Migrations** | Release command: `python tools/migrate-db.py upgrade`. |
| **Admin password** | Set `DEFAULT_ADMIN_PASSWORD` and change after first login. |

---

## Environment modes

With `ENVIRONMENT=production`:

- CORS uses `ALLOWED_ORIGINS` (no `*`).
- Strict checks on insecure config.
- Console logs stripped in frontend build.
- Generic error messages to clients.

See [SECURITY_IMPROVEMENTS.md](./SECURITY_IMPROVEMENTS.md) for details.
