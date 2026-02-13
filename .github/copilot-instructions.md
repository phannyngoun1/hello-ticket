# Copilot instructions for Hello Ticket

These notes give an AI coding agent the minimal, concrete knowledge needed to be productive in this repository.

## Big picture

- **Backend**: Python FastAPI service located in `backend/` (entry: `backend/app/main.py`). The project follows a hexagonal/clean architecture split into `domain`, `application`, `infrastructure`, `presentation`, and `shared` layers.
- **Frontend**: React + TypeScript monorepo under `frontend/` using npm workspaces. Main app is at `frontend/apps/web`, with shared packages in `frontend/packages/` (ui, api, account, sales, ticketing, custom-ui, etc.). Uses TanStack Router, TanStack Query, and shadcn/ui components.
- **Database**: Single PostgreSQL database (configured in `docker-compose.yml`). Alembic manages schema migrations via `backend/alembic` and helper scripts in `tools/migrate-db.py` + `backend/manage_migrations.py`.

## Key patterns & conventions (project-specific)

### Backend Architecture

- **Clean/hexagonal layers**: Business logic in `backend/app/domain`, use cases in `application`, HTTP in `presentation`, tech details in `infrastructure`. Avoid mixing concerns across layers.
- **CQRS pattern**: Commands and queries live in `application/` layer, routed through `shared/mediator.py`. Handlers are registered in `shared/container.py` via domain-specific registration files (`shared/container_registrations/`). Use the mediator for all business operations, not direct service calls.
- **Dependency injection**: Uses `punq` container (`backend/app/shared/container.py`). Register new services in domain-specific registration modules (`shared/container_registrations/`), not as global singletons. Follow the pattern: register handler → register mediator handler → resolve via container.
- **Middleware-first concerns**: Tenant isolation, session validation, audit logging, rate-limiting, and response caching are FastAPI middleware in `backend/app/presentation/middleware/`. **Order matters**: tenant → session → audit → error logging → rate limiting → response cache → compression. Add new cross-cutting behavior as middleware rather than sprinkling in handlers.
- **Migrations**: DO NOT autogenerate migrations unless DB is up-to-date. Use `tools/migrate-db.py` which wraps `backend/manage_migrations.py` and enforces safety checks.

### Frontend Architecture

- **Monorepo packages**: Packages in `frontend/packages/` are feature-based (e.g., `account`, `sales`, `ticketing`) or utility-based (e.g., `ui`, `api`, `utils`). Each package has its own structure: `src/` for code, `types.ts` for types, `services/` for API calls, `hooks/` for React Query hooks.
- **CRUD generation**: Use `npm run create-crud` (interactive mode) to scaffold new entities. Choose Basic (simple) or Full (advanced features). DO NOT include system fields (`id`, `created_at`, `updated_at`) in field specs—these are auto-generated. See `tools/CRUD_QUICK_GUIDE.md` for details.
- **Routing**: TanStack Router in `frontend/apps/web/src/routes/`. Routes are file-based. Protected routes require auth, tenant context via `X-Tenant-ID` header.
- **State management**: TanStack Query for server state (see `packages/api/`), local state with React hooks. No Redux/Zustand.

## Essential commands (examples you can run)

### Backend Commands

- Start local Postgres (docker):
  - `docker-compose up -d postgres` (project root) or run `./start.sh` which orchestrates DB + checks readiness.
- Create and activate Python venv (macOS/Linux):
  - `python -m venv venv && source venv/bin/activate` (Windows: `venv\Scripts\activate`)
- Install backend deps:
  - `pip install -r backend/requirements.txt` (or use Poetry with `backend/pyproject.toml`)
- Run dev server:
  - `cd backend && python -m uvicorn app.main:app --reload --port 8000`
- Run migrations:
  - Check status: `python tools/migrate-db.py status`
  - Upgrade DB: `python tools/migrate-db.py upgrade`
  - Create migration: `python tools/migrate-db.py create "description"` (only when DB status is up-to-date)
  - Create initial migration (first time): `python tools/migrate-db.py create-initial`
  - Railway/self-heal command: `python tools/migrate-db.py upgrade-or-stamp`
- Run tests:
  - `pytest -q` (run from repository root or `backend/` depending on context; tests in `backend/tests/` and root `tests/`)

### Frontend Commands

- Install dependencies:
  - `cd frontend && npm install` (uses npm workspaces)
- Start dev server:
  - `npm run dev` (runs `frontend/apps/web`, accessible at http://localhost:3000)
- Build for production:
  - `VITE_API_BASE_URL= npm run build` (same-origin API, no CORS)
- Type checking:
  - `npm run type-check` (checks all packages)
- Generate CRUD (interactive):
  - `npm run create-crud` (follow prompts, see `tools/CRUD_QUICK_GUIDE.md`)
- Create new package:
  - `npm run create-package -- <package-name> [options]` (scaffolds new package in `frontend/packages/`)
- Lint:
  - `npm run lint` (lints all packages)

## Integration points & external dependencies

- **PostgreSQL**: Single database for all tenants. Connection config in `docker-compose.yml` and `.env` / `env.example`. Default: `postgresql://ticket:ticket_pass@localhost:5432/ticket`
- **Alembic**: Migration config in `backend/alembic.ini`, versioned scripts in `backend/alembic/versions/`. Always use `tools/migrate-db.py` wrapper, not raw `alembic` commands.
- **Auth**: OpenID/OAuth2 flows in `backend/app/presentation`. Swagger UI configured in `backend/app/main.py`. Protected endpoints require `X-Tenant-ID` header and valid token (use Swagger OAuth or `POST /api/v1/auth/token`).
- **Frontend serving**: Backend serves built SPA when `FRONTEND_DIST_DIR` points to `frontend/apps/web/dist`. For development, run separate servers (backend on 8000, frontend on 3000).
- **Redis (optional)**: Caching via Redis (port 6379) if enabled. Fallback to DiskCache if Redis is unavailable. Controlled by `ENABLE_REDIS_CACHE` env var.

## Migration and release gotchas (important)

- The helper scripts explicitly check DB revision before autogenerating migrations. If you try to create a migration while DB is behind, `manage_migrations.py` will abort and instruct to `upgrade` first.
- When migration history is rewritten (e.g., squashed), use `upgrade-or-stamp` or `stamp`/`clear-version` commands provided by `tools/migrate-db.py` to recover.

## Where to look for examples

- Router registration: `backend/app/presentation/router_registry.py` (how endpoints are discovered/registered).
- Middleware examples: `backend/app/presentation/middleware/*.py` (TenantMiddleware, SessionValidationMiddleware, AuditMiddleware).
- Startup/shutdown hooks: `backend/app/startup.py` (service registration and background tasks).
- Migration tooling: `tools/migrate-db.py` and `backend/manage_migrations.py` (recommended workflows and recovery commands).

## How the agent should modify code

- Keep changes layer-aware: put data model/schema changes in `domain` and migration scripts via `tools/migrate-db.py`.
- For new endpoints: add Pydantic/SQLModel types in `domain` or `application`, add handlers in `presentation`, then register in `router_registry.py` or the appropriate router module.
- Avoid changing global logging or middleware ordering unless the change is necessary and small — middleware order affects behavior (tenant -> session -> audit -> error logging -> rate limiting -> response cache -> compression).

If anything is unclear or you want this expanded with concrete examples (e.g., a sample new endpoint PR), tell me which area to expand.
