# CLI Tools

Command-line tools for the Hello Ticket project:

- **Frontend Tools**: Scaffold packages and CRUD modules in the monorepo
- **Backend Tools**: Manage database migrations and other backend operations

## Quick Start

- **[CRUD Quick Guide](./CRUD_QUICK_GUIDE.md)** ⭐ - Interactive mode guide (recommended for new users)
- **[System Fields Guide](./SYSTEM_FIELDS_GUIDE.md)** 📋 - Understanding audit fields and what NOT to include
- **[Migration CLI Guide](./MIGRATE_DB.md)** 🗄️ - Database migration tool documentation
- **[Full Documentation](./README.md)** - Complete reference for all tools

> **Important:** Don't include system fields (`created_at`, `updated_at`, `id`, etc.) in your `--fields` parameter! See the [System Fields Guide](./SYSTEM_FIELDS_GUIDE.md) for details.

## Tools

### Frontend Tools

- **create-package**: Create a new package with the standard structure
- **create-crud**: Unified CLI to create both basic and full CRUD modules (recommended)
  - **Interactive mode by default** - Guides you through each step
  - `--type basic`: Simple CRUD based on UOM pattern
  - `--type full`: Complete CRUD with advanced features
- **create-basic-crud**: Direct access to basic CRUD generator (legacy)
- **create-full-crud**: Direct access to full CRUD generator (legacy)

### Backend Tools

- **migrate-db**: Database migration CLI tool for managing Alembic migrations
  - Run from project root: `python tools/migrate-db.py <command>`
  - See [Migration CLI Documentation](./MIGRATE_DB.md) for complete guide

## Interactive Mode (Default)

The `create-crud` tool now runs in **interactive mode by default**. Simply run:

```bash
npm run create-crud
```

The tool will guide you through:

- Package selection (from available packages)
- Entity name input
- CRUD type selection (Basic/Full)
- Field configuration with datatype selection
- Review and confirmation

See the **[CRUD Quick Guide](./CRUD_QUICK_GUIDE.md)** for detailed step-by-step instructions.

---

# Package Creation CLI Tool

A command-line tool to quickly scaffold new packages in the Truths frontend monorepo, following the same structure and patterns as existing packages like `@truths/account`.

## Usage

### Via npm script (recommended)

When using npm scripts, use `--` to pass arguments to the script:

```bash
npm run create-package -- <package-name> [options]
```

### Direct execution

```bash
node tools/create-package.cjs <package-name> [options]
```

## Options

- `--features, -f <features>`: Comma-separated list of feature modules (e.g., `"users,roles,profile"`)
- `--description, -d <desc>`: Package description
- `--author, -a <author>`: Package author (default: "Truths Platform")
- `--crud-type, -c <type>`: Automatically generate CRUD modules for features: `"basic"` or `"full"` (default: none)
- `--crud-fields, --fields`: Fields specification for CRUD modules (e.g., `"name:string,code:string"`)
- `--interactive, -i`: Enable interactive mode (prompts for missing information)
- `--install`: Install dependencies after creating package (default: false)
- `--no-install`: Skip installing dependencies (default behavior)
- `--help, -h`: Show help message

## Examples

### Create a simple package

```bash
npm run create-package -- inventory
```

This creates a basic package structure at `packages/inventory/`.

### Create a package with feature modules

```bash
npm run create-package -- billing --features invoices,payments,subscriptions
```

This creates a package with three feature modules: `invoices`, `payments`, and `subscriptions`.

### Create a package with description

```bash
npm run create-package -- analytics --description "Analytics and reporting package" --features reports,dashboards,metrics
```

### Create a package with automatic CRUD generation

```bash
# Create package with basic CRUD for features
npm run create-package -- inventory --features "category,supplier" --crud-type basic

# Create package with full CRUD for features
npm run create-package -- inventory --features "product" --crud-type full --crud-fields "name:string,price:number,status:enum"
```

### Create a package using interactive mode

```bash
# Start interactive mode - will prompt for all information
npm run create-package -- --interactive

# Or just run without package name - will auto-enable interactive mode
npm run create-package
```

### Create a package and install dependencies

```bash
# Create package and automatically install dependencies
npm run create-package -- inventory --features "items,categories" --install

# Create package with CRUD and install dependencies
npm run create-package -- inventory --features "product" --crud-type full --install
```

**Note:** When using npm scripts, remember to use `--` before the package name to pass arguments correctly.

## What Gets Created

The CLI tool creates a complete package structure:

```
packages/<package-name>/
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
├── README.md             # Package documentation
├── src/
│   ├── index.ts          # Main entry point
│   ├── registry.ts       # Component registry
│   ├── types.ts          # TypeScript types
│   └── <features>/       # Feature modules (if specified)
│       └── index.ts
└── examples/
    └── README.md         # Examples documentation
```

## Package Structure

Each generated package includes:

1. **package.json**: Configured with:

   - Correct `@truths/<package-name>` naming
   - Standard dependencies (`@truths/api`, `@truths/ui`, `@truths/utils`, `react`)
   - TypeScript configuration
   - Module exports

2. **tsconfig.json**: Extends root TypeScript config

3. **src/index.ts**: Main entry point that:

   - Exports registry and types
   - Exports feature modules
   - Registers components (ready for you to add)

4. **src/registry.ts**: Component registry system with:

   - Component metadata interface
   - Registration functions
   - Query functions (by category, by tag, etc.)

5. **src/types.ts**: Common TypeScript types:

   - Base props interfaces
   - Feature-specific types (if features are specified)
   - Configuration types

6. **README.md**: Comprehensive documentation template

## Next Steps

After creating a package:

1. Navigate to the package directory:

   ```bash
   cd packages/<package-name>
   ```

2. **Generate CRUD modules** (if not done automatically):

   ```bash
   # For simple CRUD (UOM pattern)
   npm run create-basic-crud -- <entity-name> --package <package-name>

   # For full CRUD with advanced features
   npm run create-crud -- <entity-name> --package <package-name> --fields "name:string,code:string"
   ```

3. Start building your components in `src/`

4. If you specified features, components are organized by feature module

5. Add your package to the root `tsconfig.json` paths if needed (though it should work automatically)

6. Install dependencies (if not done automatically):

   ```bash
   cd packages/<package-name>
   npm install
   ```

   Or from the root:

   ```bash
   npm install --workspace=packages/<package-name>
   ```

7. Run type checking:
   ```bash
   npm run type-check --workspace=packages/<package-name>
   ```

## CRUD Generation Options

The package creation tool supports automatic CRUD generation:

- **Basic CRUD** (`--crud-type basic`): Simple CRUD modules based on UOM pattern

  - List, create, edit dialogs
  - Service layer with API operations
  - React Query hooks
  - Basic filtering

- **Full CRUD** (`--crud-type full`): Complete CRUD with advanced features
  - All basic CRUD features
  - Status actions (lock/unlock, activate/deactivate)
  - Advanced filtering with filter sheet
  - Detail views with tabs
  - Comprehensive form validation
  - Keyboard shortcuts
  - Confirmation dialogs

## Best Practices

- Use kebab-case for package names (e.g., `user-management`, `billing-system`)
- Use plural nouns for feature modules (e.g., `users`, `invoices`, `reports`)
- Follow the same patterns as the `account` package for consistency
- Register all components in the registry for discoverability
- Export types and components from feature module `index.ts` files

## Integration with Workspace

The generated packages are automatically:

- Added to the npm workspaces (via `packages/*` pattern)
- Configured for TypeScript path resolution
- Ready for import as `@truths/<package-name>`

## Troubleshooting

### Package already exists

If you see an error that the package already exists, either:

- Use a different package name
- Delete the existing package directory first

### TypeScript errors

After creating a package, you may need to:

- Restart your TypeScript server in your IDE
- Run `npm install` in the root to update workspaces

### Path resolution issues

If imports don't resolve, check:

- The package is in `packages/` directory
- The root `tsconfig.json` includes the workspace paths
- Your IDE has reloaded the TypeScript configuration

---

# Unified CRUD Module Creation CLI Tool

A unified command-line tool to scaffold both **basic** and **full** CRUD (Create, Read, Update, Delete) modules within existing packages. This is the main entry point for CRUD generation.

## Usage

### Via npm script (recommended)

```bash
npm run create-crud -- <entity-name> --package <package-name> [options]
```

### Direct execution

```bash
node tools/create-crud.cjs <entity-name> --package <package-name> [options]
```

## CRUD Types

The unified CLI supports two types of CRUD generation:

### Basic CRUD (`--type basic`)

Simple CRUD modules based on UOM pattern:

- List, create, edit dialogs
- Service layer with API operations
- React Query hooks
- Basic filtering

### Full CRUD (`--type full`)

Complete CRUD with advanced features (similar to users module):

- All basic CRUD features
- Status actions (lock/unlock, activate/deactivate)
- Advanced filtering with filter sheet
- Detail views with tabs
- Comprehensive form validation
- Keyboard shortcuts
- Confirmation dialogs

## Required Arguments

- `<entity-name>`: Entity name in kebab-case (e.g., `product`, `order`, `invoice`)
- `--package, -p <name>`: Package name where CRUD will be created (must exist)

## Options

- `--type, -t <type>`: CRUD type: `"basic"` or `"full"` (default: prompts in interactive mode)
- `--fields, -f <fields>`: Comma-separated list of fields (e.g., `"name:string,price:number:currency,status:enum"`)
- `--endpoint, -e <endpoint>`: API endpoint path (default: pluralized entity name)
- `--var-name, -v <name>`: Short variable name (for basic CRUD only, default: auto-generated)
- `--no-dialog`: Skip generating dialog wrapper components (full CRUD only)
- `--no-filter`: Skip generating filter component (full CRUD only)
- `--interactive, -i`: Enable interactive mode (default behavior)
- `--no-interactive`: Disable interactive mode (use command-line arguments only)

## Examples

### Create a basic CRUD module

```bash
npm run create-crud -- category --package inventory --type basic
```

### Create a full CRUD module

```bash
npm run create-crud -- product --package inventory --type full --fields "name:string,price:number:currency,status:enum"
```

### Interactive mode (default - recommended)

```bash
# Interactive mode is now the default - just run:
npm run create-crud

# Or explicitly enable interactive mode:
npm run create-crud -- --interactive
```

The CLI will guide you through:

- **Step 1**: Package selection (from available packages or manual entry)
- **Step 2**: Entity name input
- **Step 3**: CRUD type selection (Basic or Full)
- **Step 4**: Fields (interactive collection with type and format selection)
- **Step 5**: Endpoint path (optional)
- **Step 6**: Additional options based on CRUD type
- **Step 7**: Review summary and confirmation

See the **[CRUD Quick Guide](./CRUD_QUICK_GUIDE.md)** for detailed step-by-step instructions.

### Full CRUD with custom endpoint

```bash
npm run create-crud -- order --package billing --type full --endpoint orders --fields "total:number:currency,status:enum"
```

## Legacy Commands

For backward compatibility, the individual CLI tools are still available:

- `npm run create-basic-crud` - Direct access to basic CRUD generator
- `npm run create-full-crud` - Direct access to full CRUD generator

However, it's recommended to use `npm run create-crud` with the `--type` option for consistency.

---

# Full CRUD Module Creation CLI Tool (Legacy)

This is the detailed documentation for the full CRUD generator. For most users, use `npm run create-crud -- --type full` instead.

## Usage

### Via npm script (recommended)

```bash
npm run create-crud -- <entity-name> --package <package-name> [options]
```

### Direct execution

```bash
node tools/create-crud.cjs <entity-name> --package <package-name> [options]
```

## Required Arguments

- `<entity-name>`: Entity name in kebab-case (e.g., `product`, `order`, `invoice`)
- `--package, -p <name>`: Package name where CRUD will be created (must exist)

## Options

- `--fields, -f <fields>`: Comma-separated list of fields with types (e.g., `"name:string,price:number,status:enum"`)
- `--endpoint, -e <endpoint>`: API endpoint path (default: pluralized entity name)
- `--no-dialog`: Skip generating dialog wrapper components
- `--no-filter`: Skip generating filter component
- `--interactive, -i`: Enable interactive mode (prompts for missing information)

## Field Types

Supported field types:

- `string` (default)
- `number`
- `date`
- `boolean`
- `enum`

## Examples

### Create a basic CRUD module

```bash
npm run create-crud -- product --package inventory
```

This creates a basic product CRUD with a default `name` field.

### Create a CRUD module with custom fields

```bash
npm run create-crud -- order --package billing --fields "total:number,status:enum,orderDate:date"
```

### Create a CRUD module with custom endpoint

```bash
npm run create-crud -- invoice --package billing --endpoint invoices --fields "amount:number,dueDate:date,paid:boolean"
```

### Create a CRUD without dialog wrappers

```bash
npm run create-crud -- category --package inventory --no-dialog
```

### Interactive mode

Start the CLI without arguments to enter interactive mode, or use `--interactive` flag:

```bash
npm run create-crud -- --interactive
# or
npm run create-crud
```

The CLI will prompt you for:

- Entity name
- Package name
- **Fields (interactive)**: Add fields one by one with a type selection menu:
  - Enter field name (e.g., "name", "price", "status")
  - Choose field type from menu (String, Number, Date, Boolean, Enum)
  - For **Number** fields: Select format (Integer, Decimal/Float, Currency, Percentage)
  - For **Date** fields: Select format (Date only, Date and Time, Timestamp, ISO Date)
  - Type 'done' when finished
- Endpoint path (optional)
- Whether to skip dialogs (optional)
- Whether to skip filter (optional)

## What Gets Created

The CLI tool creates a complete CRUD module structure:

```
packages/<package-name>/src/<entity-plural>/
├── index.ts                    # Module exports
├── <entity>-service.ts         # API service layer
├── use-<entity-plural>.tsx     # React Query hooks
├── <entity>-provider.tsx       # Context provider
├── <entity>-list.tsx           # List component
├── <entity>-list-container.tsx # List container with state
├── <entity>-detail.tsx         # Detail view component
├── create-<entity>.tsx         # Create form component
├── create-<entity>-dialog.tsx  # Create dialog (optional)
├── edit-<entity>.tsx           # Edit form component
├── edit-<entity>-dialog.tsx    # Edit dialog (optional)
└── <entity>-filter-sheet.tsx   # Filter component (optional)
```

## Generated Files Overview

### Service File (`<entity>-service.ts`)

- Handles all API operations (fetch, create, update, delete)
- Transforms data between backend DTOs and frontend types
- Includes pagination support
- Configurable endpoints

### Hooks File (`use-<entity-plural>.tsx`)

- React Query hooks for data fetching
- Mutation hooks for create, update, delete operations
- Automatic query invalidation
- Type-safe with TypeScript

### Provider File (`<entity>-provider.tsx`)

- React Context provider for the service
- Makes service available to all child components
- Provides `use<Entity>Service()` hook

### Component Files

- **List**: Displays paginated list of entities
- **List Container**: Integrates list with data fetching
- **Detail**: Shows entity details
- **Create/Edit**: Forms for creating and editing entities
- **Dialogs**: Modal wrappers for create/edit (optional)
- **Filter**: Filtering UI (optional)

### Types

The tool automatically updates `packages/<package>/src/types.ts` with:

- `<Entity>` interface
- `Create<Entity>Input` interface
- `Update<Entity>Input` interface
- `<Entity>Filter` interface

### Package Index

The tool automatically updates `packages/<package>/src/index.ts` to export the new entity module.

## Workflow

1. **Create the package** (if it doesn't exist):

   ```bash
   npm run create-package -- inventory
   ```

2. **Create CRUD modules** for entities in that package:

   ```bash
   npm run create-crud -- product --package inventory --fields "name:string,price:number"
   npm run create-crud -- category --package inventory --fields "name:string,description:string"
   ```

3. **Implement the components**: The generated components are stubs - you'll need to implement the UI based on your design system.

4. **Configure the service**: Update the service configuration in your app to provide API endpoints.

5. **Use in your app**:

   ```tsx
   import { ProductProvider, ProductListContainer } from "@truths/inventory";

   <ProductProvider
     config={{ apiClient, endpoints: { products: "/api/products" } }}
   >
     <ProductListContainer />
   </ProductProvider>;
   ```

## Next Steps After Creation

1. **Implement component UIs**: Replace the stub components with actual UI using your design system
2. **Add form validation**: Enhance create/edit forms with validation logic
3. **Customize filters**: Implement filtering logic in the filter component
4. **Add features**: Extend with additional features like bulk operations, export, etc.
5. **Register components**: If using the component registry, register your components

## Troubleshooting

### Package doesn't exist

If you see an error that the package doesn't exist:

```bash
npm run create-package -- <package-name>
```

### Entity already exists

If the entity module already exists:

- Delete the existing directory: `packages/<package>/src/<entity-plural>/`
- Or use a different entity name

### Type errors

After creating a CRUD module:

- Restart your TypeScript server
- Verify types were added to `types.ts`
- Check that imports are correct in generated files

---

# Basic CRUD Module Creation CLI Tool

A simplified command-line tool to scaffold basic CRUD modules based on the UOM (Unit of Measure) pattern. This tool uses template files that are copied and customized, making it easier to maintain and modify.

## Usage

### Via npm script (recommended)

```bash
npm run create-basic-crud -- <entity-name> --package <package-name> [options]
```

### Direct execution

```bash
node tools/create-basic-crud.cjs <entity-name> --package <package-name> [options]
```

## Required Arguments

- `<entity-name>`: Entity name in kebab-case (e.g., `category`, `supplier`, `product`)
- `--package, -p <name>`: Package name where CRUD will be created (must exist)

## Options

- `--fields, -f <fields>`: Comma-separated list of fields with types (e.g., `"name:string,code:string,email:string"`)
- `--endpoint, -e <endpoint>`: API endpoint path (default: `/api/v1/<package>/<entity-plural>`)
- `--var-name, -v <name>`: Short variable name (default: auto-generated from entity name)

## Field Types

Supported field types:

- `string` (default)
- `number`
- `boolean`
- `date`

## Examples

### Create a basic CRUD module

```bash
npm run create-basic-crud -- category --package inventory
```

This creates a basic category CRUD with default `code` and `name` fields.

### Create a CRUD module with custom fields

```bash
npm run create-basic-crud -- supplier --package inventory --fields "name:string,code:string,email:string,phone:string"
```

### Create a CRUD module with custom endpoint

```bash
npm run create-basic-crud -- product --package inventory --endpoint /api/v1/inventory/products --fields "name:string,price:number"
```

### Interactive mode

Start the CLI without arguments to enter interactive mode, or use `--interactive` flag:

```bash
npm run create-basic-crud -- --interactive
# or
npm run create-basic-crud
```

The CLI will prompt you for:

- Entity name
- Package name
- **Fields (interactive)**: Add fields one by one with a type selection menu:
  - Enter field name (e.g., "name", "code", "email")
  - Choose field type from menu (String, Number, Date, Boolean)
  - For **Number** fields: Select format (Integer, Decimal/Float, Currency, Percentage)
  - For **Date** fields: Select format (Date only, Date and Time, Timestamp, ISO Date)
  - Type 'done' when finished
- Endpoint path (optional)
- Variable name (optional)

## What Gets Created

The CLI tool creates a complete basic CRUD module structure using template files:

```
packages/<package-name>/src/<entity-plural>/
├── index.ts                    # Module exports
├── <entity>-service.ts         # API service layer
├── <entity>-provider.tsx       # Context provider
├── use-<entity-plural>.tsx     # React Query hooks
├── <entity>-list.tsx           # List component
├── <entity>-list-container.tsx # List container with state
├── create-<entity>-dialog.tsx  # Create dialog
└── edit-<entity>-dialog.tsx    # Edit dialog
```

## Template-Based Generation

This tool uses template files located in `tools/templates/basic-crud/`:

- Templates are copied and placeholders are replaced
- Makes it easy to modify templates for your needs
- No complex code generation - just simple string replacement

## Generated Files Overview

### Service File (`<entity>-service.ts`)

- Handles all API operations (fetch, create, update, delete, search)
- Transforms data between backend DTOs and frontend types
- Includes pagination support
- Configurable endpoints

### Provider File (`<entity>-provider.tsx`)

- React Context provider for the service
- Makes service available to all child components
- Provides `use<Entity>Service()` hook

### Hooks File (`use-<entity-plural>.tsx`)

- React Query hooks for data fetching
- Mutation hooks for create, update, delete operations
- Automatic query invalidation
- Type-safe with TypeScript

### List Component (`<entity>-list.tsx`)

- Displays paginated list of entities using DataTable
- Supports search, create, edit, delete actions
- Configurable columns based on fields

### Create Dialog (`create-<entity>-dialog.tsx`)

- Full-screen dialog for creating new entities
- Form validation
- Keyboard shortcuts
- Confirmation dialog

### Edit Dialog (`edit-<entity>-dialog.tsx`)

- Full-screen dialog for editing existing entities
- Form validation
- Keyboard shortcuts
- Confirmation dialog

### List Container (`<entity>-list-container.tsx`)

- Container component that integrates list with data fetching
- Manages state and mutations
- Handles create, edit, delete operations
- Toast notifications

### Types

The tool automatically updates `packages/<package>/src/types.ts` with:

- `<Entity>` interface
- `Create<Entity>Input` interface
- `Update<Entity>Input` interface

### Package Index

The tool automatically updates `packages/<package>/src/index.ts` to export the new entity module.

## Comparison with Full CRUD Generator

This basic CRUD generator is simpler than `create-crud`:

- **No detail views** - Just list, create, and edit
- **No filter components** - Basic search only
- **Simpler dialogs** - Based on UOM pattern
- **Template-based** - Easier to customize templates
- **Faster generation** - Less code to generate

## Workflow

1. **Create the package** (if it doesn't exist):

   ```bash
   npm run create-package -- inventory
   ```

2. **Create basic CRUD modules** for entities in that package:

   ```bash
   npm run create-basic-crud -- category --package inventory
   npm run create-basic-crud -- supplier --package inventory --fields "name:string,code:string,email:string"
   ```

3. **Customize the generated files**:

   - Update form fields and validation
   - Customize list columns
   - Modify API endpoints if needed

4. **Use in your app**:

   ```tsx
   import { CategoryProvider, CategoryListContainer } from "@truths/inventory";

   <CategoryProvider
     config={{
       apiClient,
       endpoints: { category: "/api/v1/inventory/categories" },
     }}
   >
     <CategoryListContainer />
   </CategoryProvider>;
   ```

## Next Steps After Creation

1. **Review generated files**: Check all files in the entity directory
2. **Update types**: Verify types in `types.ts` match your needs
3. **Customize forms**: Update create/edit dialogs with specific field types (e.g., Select, DatePicker)
4. **Configure endpoints**: Update provider with correct API endpoints
5. **Add translations**: Update i18n keys for your entity
6. **Test**: Verify CRUD operations work correctly

## Customizing Templates

Templates are located in `tools/templates/basic-crud/`. You can:

- Modify templates to match your patterns
- Add new template files
- Customize placeholders and replacements

## Troubleshooting

### Package doesn't exist

If you see an error that the package doesn't exist:

```bash
npm run create-package -- <package-name>
```

### Entity already exists

If the entity module already exists:

- Delete the existing directory: `packages/<package>/src/<entity-plural>/`
- Or use a different entity name

### Template not found

If you see a "Template not found" warning:

- Check that `tools/templates/basic-crud/` exists
- Verify template files are present

### Type errors

After creating a basic CRUD module:

- Restart your TypeScript server
- Verify types were added to `types.ts`
- Check that imports are correct in generated files
