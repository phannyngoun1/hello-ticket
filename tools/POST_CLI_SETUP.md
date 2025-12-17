# Post-CLI Setup Instructions

After running the unified CRUD CLI (`node tools/create-crud-unified.cjs`), follow these steps to ensure proper module resolution and dependency configuration.

**Note:** The CLI generates both backend and frontend code following the vendor pattern with CQRS architecture.

## 1. Frontend Dependencies

### Add Package to Web App
The generated frontend package (e.g., `@truths/sales`) needs to be added to the web app's dependencies.

**File:** `frontend/apps/web/package.json`

Add the new package to the `dependencies` section:
```json
"dependencies": {
  "@truths/account": "*",
  "@truths/api": "*",
  "@truths/sales": "*",  // <-- Add your new package here
  "@truths/ui": "*",
  // ... other dependencies
}
```

### Install Dependencies
Run npm install from the frontend root to link workspace packages:
```bash
cd frontend
npm install
```

## 2. Backend Dependencies

### Repository Implementation
The CLI generates domain interfaces but does NOT generate the infrastructure implementation. You need to create:

**File:** `backend/app/infrastructure/{module}/{entity}_repository.py`

Example for `sales/customer`:
```python
from app.domain.sales.entities import Customer
from app.domain.sales.repositories import CustomerRepository
from app.shared.database import Database
from typing import List, Optional

class SQLCustomerRepository(CustomerRepository):
    def __init__(self, db: Database):
        self.db = db
    
    def get_by_id(self, customer_id: int) -> Optional[Customer]:
        # Implementation
        pass
    
    def get_all(self) -> List[Customer]:
        # Implementation
        pass
    
    def save(self, customer: Customer) -> Customer:
        # Implementation
        pass
    
    def delete(self, customer_id: int) -> None:
        # Implementation
        pass
```

### Container Registration
The CLI generates commented-out registration code in `backend/app/shared/container.py`. After creating the repository implementation:

1. **Import section** - Uncomment the repository import:
```python
from app.infrastructure.sales.customer_repository import SQLCustomerRepository
```

2. **Repository registration** - Uncomment the repository registration:
```python
container.register(CustomerRepository, instance=SQLCustomerRepository())
```

3. **Handler registrations** - Uncomment handler registrations:
```python
customer_command_handler = CustomerCommandHandler(
    customer_repository=container.resolve(CustomerRepository)
)
container.register(CustomerCommandHandler, instance=customer_command_handler)

customer_query_handler = CustomerQueryHandler(
    customer_repository=container.resolve(CustomerRepository)
)
container.register(CustomerQueryHandler, instance=customer_query_handler)
```

4. **Mediator registrations** - Uncomment mediator handler registrations:
```python
mediator = container.resolve(Mediator)
mediator.register_handler(CreateCustomerCommand, container.resolve(CustomerCommandHandler).handle_create)
mediator.register_handler(UpdateCustomerCommand, container.resolve(CustomerCommandHandler).handle_update)
mediator.register_handler(DeleteCustomerCommand, container.resolve(CustomerCommandHandler).handle_delete)
mediator.register_handler(GetCustomerByIdQuery, container.resolve(CustomerQueryHandler).handle_get_by_id)
mediator.register_handler(GetAllCustomersQuery, container.resolve(CustomerQueryHandler).handle_get_all)
mediator.register_handler(GetCustomersWithFiltersQuery, container.resolve(CustomerQueryHandler).handle_get_with_filters)
```

**Note:** The CLI automatically generates these registrations as commented code. Simply uncomment them after creating the repository implementation.

## 3. TypeScript Configuration (if needed)

If you still see module resolution errors after installing dependencies:

### Restart TypeScript Server
In VS Code:
1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Type "TypeScript: Restart TS Server"
3. Press Enter

### Verify tsconfig.json
Ensure `frontend/tsconfig.json` has proper path mappings:
```json
{
  "compilerOptions": {
    "paths": {
      "@truths/*": ["./packages/*/src"]
    }
  }
}
```

## 4. Database Migration (Backend)

Create a database migration for the new entity:

```bash
cd backend
python manage_migrations.py create "create_{entity}_table"
```

Edit the generated migration file to include your table schema.

## 5. Register Routes

### Backend Routes
Add to `backend/app/presentation/core/routes/routes.json`:
```json
{
  "path": "/api/{module}/{entity}",
  "name": "{Entity} Management",
  "module": "{module}"
}
```

### Frontend Routes
Routes are auto-generated in `frontend/apps/web/src/routes/{module}/` but verify they're properly exported in the route index.

## Quick Checklist

After running the CLI, complete these steps:

- [ ] Add `@truths/{package}` to `frontend/apps/web/package.json`
- [ ] Run `npm install` in `frontend/`
- [ ] Create `SQLCustomerRepository` implementation in `backend/app/infrastructure/`
- [ ] Uncomment container registrations in `backend/app/shared/container.py`
- [ ] Create database migration
- [ ] Test backend API endpoints
- [ ] Test frontend pages
- [ ] Restart TypeScript server if needed

## Common Issues

### "Cannot find module '@truths/sales'"
**Solution:** Add package to `frontend/apps/web/package.json` and run `npm install`

### "CustomerRepository is not defined"
**Solution:** Import `CustomerRepository` from domain and uncomment container registration

### "SQLCustomerRepository is not defined"
**Solution:** Create the repository implementation in `infrastructure/` folder

### Indentation errors in container.py
**Solution:** Verify all handler registrations are inside `setup_container()` function

---

## Automated Post-CLI Setup (Future Enhancement)

Consider adding these steps to the CLI tool:
1. Auto-update `frontend/apps/web/package.json`
2. Auto-run `npm install` with a flag
3. Generate repository template/stub
4. Auto-create database migration template

