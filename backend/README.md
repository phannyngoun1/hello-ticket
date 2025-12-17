# Hello Ticket - Backend

Modern FastAPI backend implementing Hexagonal Architecture, CQRS, and Domain-Driven Design.

---

## 📚 Complete Documentation

**[View Full Backend Documentation →](../docs/backend/README.md)**

All comprehensive backend documentation has been consolidated in the main docs folder.

---

## 🚀 Quick Start

```bash
# 1. Start databases
cd /workspace  # or your project root
./start.sh

# 2. Setup environment (first time)
cd backend
cp env.example .env
pip install -r requirements.txt

# 3. Start backend
python -m uvicorn app.main:app --reload
```

**Access**: http://localhost:8000/docs (Swagger UI)

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── domain/              # Business logic & entities
│   │   ├── aggregates/      # Aggregate roots
│   │   ├── entities/        # Domain entities
│   │   ├── events/          # Domain events
│   │   ├── repositories/    # Repository interfaces
│   │   └── value_objects/   # Value objects
│   │
│   ├── application/         # Use cases (CQRS)
│   │   ├── commands/        # Write operations
│   │   ├── queries/         # Read operations
│   │   ├── handlers/        # Command/Query handlers
│   │   ├── services/        # Application services
│   │   └── workflows/       # Business workflows
│   │
│   ├── infrastructure/      # Technical implementations
│   │   ├── database/        # Database connection & models
│   │   ├── repositories/    # Repository implementations
│   │   ├── security/        # Auth & JWT
│   │   ├── cache/           # Redis caching
│   │   ├── mappers/         # Domain ↔ DB mapping
│   │   └── integrations/    # External services
│   │
│   ├── presentation/        # API layer
│   │   ├── api/             # Request/Response schemas
│   │   ├── routes/          # API endpoints
│   │   ├── dependencies/    # FastAPI dependencies
│   │   └── middleware/      # HTTP middleware
│   │
│   ├── shared/              # Shared components
│   │   ├── container.py     # DI container
│   │   ├── mediator.py      # CQRS mediator
│   │   ├── exceptions.py    # Custom exceptions
│   │   └── tenant_context.py  # Multi-tenancy
│   │
│   ├── main.py              # Application entry point
│   └── startup.py           # Startup tasks
│
├── migrations/              # Database migrations
├── requirements.txt         # Python dependencies
├── env.example             # Environment template
├── Dockerfile              # Docker image
└── PRODUCTION_CHECKLIST.md  # Deployment guide
```

---

## ⚡ Key Features

- ✅ **Clean Architecture** - Hexagonal architecture with DDD
- ✅ **CQRS Pattern** - Command/Query separation
- ✅ **Multi-Tenancy** - Complete tenant isolation
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Role-Based Access** - Fine-grained permissions
- ✅ **Session Management** - Device-specific sessions
- ✅ **Redis Caching** - Performance optimization
- ✅ **Event Sourcing** - Domain events support
- ✅ **PostgreSQL** - Single unified database
- ✅ **Production Ready** - Security validations

---

## 🗄️ Database Architecture

### PostgreSQL Database (Port 5432)

Single unified database containing all data:

- Users & Authentication
- Sessions (device-specific)
- Tenants & Subscriptions
- Roles & Groups (RBAC)
- Products
- Orders
- Business-specific entities

### Redis Cache (Port 6379) - Optional

- Query result caching
- Session storage
- Performance optimization
- Falls back to DiskCache if unavailable

---

## ⚙️ Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your settings
# Key variables:
ENVIRONMENT=development          # development or production
DATABASE_URL=postgresql://...    # Operational DB
SECRET_KEY=<generate-strong-key> # JWT secret
ALLOWED_ORIGINS=*                # CORS (specific in prod!)
DEFAULT_TENANT_ID=default-tenant # Default tenant
ENABLE_REDIS_CACHE=true          # Enable caching
```

---

## 🌐 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/token` - Login (get JWT)
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Current user info
- `POST /api/v1/auth/logout` - Logout

### Users

- `GET /api/v1/users` - List users
- `GET /api/v1/users/{id}` - Get user
- `POST /api/v1/users` - Create user
- `PATCH /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Products

- `GET /api/v1/products` - List products
- `GET /api/v1/products/{id}` - Get product
- `POST /api/v1/products` - Create product
- `PATCH /api/v1/products/{id}` - Update product
- `DELETE /api/v1/products/{id}` - Delete product

### Orders

- `GET /api/v1/orders` - List orders
- `GET /api/v1/orders/{id}` - Get order
- `POST /api/v1/orders` - Create order
- `POST /api/v1/orders/{id}/confirm` - Confirm order
- `POST /api/v1/orders/{id}/cancel` - Cancel order

### Tenants

- `GET /api/v1/tenants` - List tenants
- `POST /api/v1/tenants` - Create tenant
- `GET /api/v1/tenants/{id}` - Get tenant details

**[Interactive API Docs →](http://localhost:8000/docs)**

---

## 📖 Documentation Links

- **[Backend Documentation](../docs/backend/README.md)** - Complete guide
- **[Backend Quick Start](../docs/backend/QUICKSTART.md)** - 5-minute setup
- **[Architecture Guide](../docs/backend/ARCHITECTURE.md)** - Hexagonal, CQRS, DDD
- **[Multi-Tenancy](../docs/backend/MULTI_TENANCY.md)** - Multi-tenancy guide
- **[Database Strategies](../docs/backend/DATABASE_STRATEGIES.md)** - DB architecture
- **[Session Management](../docs/backend/SESSION_MANAGEMENT.md)** - Session handling
- **[Production Checklist](./PRODUCTION_CHECKLIST.md)** - Deployment guide

---

## 🔐 Security Features

- ✅ **Environment Validation** - Fails fast on insecure production configs
- ✅ **JWT with Refresh** - Secure token management
- ✅ **Password Hashing** - bcrypt with 12 rounds
- ✅ **CORS Protection** - Environment-aware CORS
- ✅ **Session Security** - Device tracking, IP validation
- ✅ **SQL Injection Protection** - Parameterized queries
- ✅ **Input Validation** - Pydantic models

See [../SECURITY_IMPROVEMENTS.md](../SECURITY_IMPROVEMENTS.md) for recent security enhancements.

---

## 🧪 Development

### Database Migrations

Use the migration CLI tool to manage database migrations (from project root):

```bash
# Check migration status
python tools/migrate-db.py status

# Upgrade to latest migration
python tools/migrate-db.py upgrade

# Show current revision
python tools/migrate-db.py current

# View migration history
python tools/migrate-db.py migrate history

# Create new migration
python tools/migrate-db.py migrate create "Description of changes"
```

**See [../tools/MIGRATE_DB.md](../tools/MIGRATE_DB.md) for complete migration CLI documentation.**

### Code Quality

```bash
# Format code
black app/
isort app/

# Type checking
mypy app/

# Run linter
ruff app/
```

### Testing

```bash
# Run tests (when implemented)
pytest

# With coverage
pytest --cov=app tests/
```

---

## 🐳 Docker

```bash
# Start all services
./start.sh

# Or manually
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Reset everything
docker compose down -v
```

---

## 🚀 Production Deployment

See **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** for complete deployment guide.

### Key Steps:

1. Set `ENVIRONMENT=production`
2. Generate strong `SECRET_KEY`
3. Configure `ALLOWED_ORIGINS` (no wildcards!)
4. Use PostgreSQL (not SQLite)
5. Enable HTTPS
6. Set up monitoring

---

## 🛠️ Tech Stack

- **FastAPI** - Web framework
- **SQLModel** - ORM with Pydantic
- **PostgreSQL** - Database
- **Redis** - Caching layer
- **Punq** - Dependency injection
- **python-jose** - JWT handling
- **passlib** - Password hashing
- **Pydantic** - Data validation

---

## 🆘 Troubleshooting

### Database connection error

```bash
# Check if databases are running
docker compose ps

# Restart databases
docker compose restart

# Check logs
docker compose logs -f
```

### Port already in use

```bash
# Check what's using port 8000
lsof -nP -iTCP:8000 | grep LISTEN

# Kill the process or change port
```

### Environment validation errors

```bash
# Development: Shows warnings but continues
# Production: Fails fast - fix issues in .env

# Check your .env configuration
cat .env
```

---

## 🎉 Learn More

Visit the **[complete backend documentation](../docs/backend/README.md)** for detailed guides, patterns, and best practices.

---

**Built with clean architecture principles and modern Python** 🐍
