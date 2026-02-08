# Hello Ticket - Full-Stack Application

**Development guide.** For production deployment (combined run, Railway) see **[README-PRODUCTION.md](./README-PRODUCTION.md)**.

## 🚀 Quick Start (3 Commands!)

```bash
# 1. Start databases
./start.sh

# 2. Start backend
cd backend
cp env.example .env  # First time only
python -m venv venv  # First time only
source venv/bin/activate  # Activate venv (use `venv\Scripts\activate` on Windows)
pip install -r requirements.txt  # First time only
python -m uvicorn app.main:app --reload

# 3. Start frontend (in another terminal)
cd frontend
npm install  # First time only
npm run dev
```

**Access:**

- 🎨 Frontend: http://localhost:3000
- 📡 Backend API: http://localhost:8000/docs
- 🗄️ PostgreSQL DB: localhost:5432

---

### Database

```bash
# Start all services
./start.sh

# Stop services
docker compose down

# View logs
docker compose logs -f

# Reset everything
docker compose down -v && ./start.sh
```

### Backend

```bash
# Start backend
cd backend
python -m venv venv  # First time only
source venv/bin/activate  # Activate venv (use `venv\Scripts\activate` on Windows)
pip install -r requirements.txt  # First time only
python -m uvicorn app.main:app --reload

# Initialize & run migrations (from project root)
# First time setup: Create initial migration if none exists
python tools/migrate-db.py status     # Check if migrations exist
# If no migrations exist, create initial migration:
python tools/migrate-db.py create-initial    # Create initial migration (creates all tables)
python tools/migrate-db.py upgrade    # Apply migrations (creates all tables)
python tools/migrate-db.py status     # Verify migration status

# When models change: Create new migration
python tools/migrate-db.py create "Description of changes"  # Create migration from model changes
python tools/migrate-db.py upgrade    # Apply pending migrations

# Format code
black app/
isort app/
```

### Frontend

```bash
# Start frontend
cd frontend
npm run dev

# Build (production bundle; for combined serve see README-PRODUCTION.md)
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

---

## 🧪 Development Workflow

### Daily Development

```bash
# Terminal 1: Start databases
./start.sh

# Terminal 2: Start backend
cd backend && python -m uvicorn app.main:app --reload

# Terminal 3: Start frontend
cd frontend && npm run dev
```

### First-Time Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd hello-ticket

# 2. Backend setup
cd backend
cp env.example .env
pip install -r requirements.txt

# 3. Frontend setup
cd ../frontend
npm install

# 4. Start databases
cd ..
./start.sh

# 5. Initialize database migrations
# Check if migrations exist
python tools/migrate-db.py status
# If no migrations exist, create initial migration:
python tools/migrate-db.py create-initial    # Create initial migration
python tools/migrate-db.py upgrade    # Apply migrations (creates all tables)

# 6. Run backend
cd backend
python -m uvicorn app.main:app --reload
```

## 🆘 Troubleshooting

### Backend won't start

```bash
# Check if databases are running
docker compose ps

# Restart databases
docker compose restart

# Check logs
docker compose logs -f
```

### Frontend build fails

```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Port already in use

```bash
# Find what's using the port
lsof -nP -iTCP:5432 | grep LISTEN
lsof -nP -iTCP:8000 | grep LISTEN
lsof -nP -iTCP:3000 | grep LISTEN

# Kill the process or use different ports
```

### Database connection error

```bash
# Make sure Docker is running
docker ps

# Restart services
docker compose down
./start.sh

# Check DATABASE_URL in backend/.env
```

### Migration issues

```bash
# If only alembic_version table exists but no other tables:
# 1. Check if migration files exist
ls backend/alembic/versions/

# 2. If no migration files exist, create initial migration:
python tools/migrate-db.py create-initial    # Create initial migration
python tools/migrate-db.py upgrade    # Apply migrations

# 3. Verify tables were created
python tools/migrate-db.py status

# 4. If migration fails with "sqlmodel not defined" error:
# Edit the migration file and replace sqlmodel.sql.sqltypes.AutoString() with sa.String()
```

---

## 🎓 Learn More

- **[Full Documentation](./docs/INDEX.md)** - Complete documentation index
- **[API Documentation](http://localhost:8000/docs)** - Interactive API docs (when running)
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Common tasks cheat sheet

---

## 📝 Development Notes

### Environment Modes

- **development** (default): Permissive CORS (`*`), warnings for weak configs, detailed errors.
- **production**: Explicit CORS, strict checks, frontend strips console.log. See [README-PRODUCTION.md](./README-PRODUCTION.md) and [SECURITY_IMPROVEMENTS.md](./SECURITY_IMPROVEMENTS.md).

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## 📧 Support

- **API Docs**: http://localhost:8000/docs
- **Issues**: GitHub Issues

---
