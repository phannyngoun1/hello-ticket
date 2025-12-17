# CRUD Creation Tool - Quick Guide

A quick guide to using the interactive CRUD creation tool. The tool now runs in **interactive mode by default**, guiding you through each step.

## 🚀 Quick Start

Simply run the command without any arguments:

```bash
npm run create-crud
```

The tool will guide you through:

1. **Package Selection** - Choose from available packages or enter manually
2. **Entity Name** - Enter your entity name (e.g., "product", "order")
3. **CRUD Type** - Choose Basic or Full CRUD
4. **Fields** - Add fields interactively with datatype selection
5. **Review** - Review all selections before generation
6. **Confirmation** - Confirm to proceed with generation

## 📋 Step-by-Step Interactive Flow

### Step 1: Package Selection

The tool automatically scans your `packages/` directory and shows available packages:

```
Step 1: Select Package

Available packages:

  1. account
  2. inventory
  3. purchasing
  4. sales
  5. Enter package name manually

Select package (1-5) [5]:
```

- **Select by number**: Choose a package from the list (1-4)
- **Manual entry**: Select option 5 (or press Enter) to type a package name
- **Validation**: The tool checks if the package exists and offers to create it if missing

### Step 2: Entity Name

Enter your entity name in kebab-case:

```
Step 2: Entity Name

Entity name (e.g., "product", "order", "invoice"): product
✓ Entity name: product
```

**Rules:**

- Must be lowercase
- Can contain letters, numbers, and hyphens
- Examples: `product`, `order-item`, `invoice-line`

### Step 3: CRUD Type Selection

Choose between Basic and Full CRUD:

```
Step 3: Select CRUD Type

  1. Basic CRUD - Simple CRUD based on UOM pattern
     • List, create, edit dialogs
     • Service layer with API operations
     • React Query hooks
     • Basic filtering

  2. Full CRUD - Complete CRUD with advanced features
     • All basic CRUD features
     • Status actions (lock/unlock, activate/deactivate)
     • Advanced filtering with filter sheet
     • Detail views with tabs
     • Comprehensive form validation
     • Keyboard shortcuts
     • Confirmation dialogs

Choose type (1-2) [1]:
```

**Basic CRUD**: Simple, fast, perfect for simple entities  
**Full CRUD**: Feature-rich, similar to the users module

### Step 4: Field Configuration

Add fields one by one with interactive type selection:

```
Step 4: Field Configuration
Add fields one by one. Enter 'done' when finished, or press Enter to skip.

Field 1 name (or 'done' to finish): name

Select field type for "name":
  1. String
  2. Number
  3. Date
  4. Boolean
  5. Enum

Choose type (1-5) [1]: 1
✓ Added field: name (String)
```

#### Number Fields

If you select Number, you'll be prompted for format:

```
Select number format for "price":
  1. Integer
  2. Decimal/Float
  3. Currency
  4. Percentage

Choose format (1-4) [1]: 3
✓ Added field: price (Number (Currency))
```

#### Date Fields

If you select Date, you'll be prompted for format:

```
Select date format for "created_at":
  1. Date only (YYYY-MM-DD)
  2. Date and Time (YYYY-MM-DD HH:mm:ss)
  3. Timestamp
  4. ISO Date String

Choose format (1-4) [1]: 2
✓ Added field: created_at (Date (Date and Time))
```

#### Finishing Field Collection

Type `done` when you're finished adding fields:

```
Field 3 name (or 'done' to finish): done
✓ Configured 2 field(s)
```

### Step 5: Endpoint Configuration (Optional)

Set a custom API endpoint or use the default:

```
API endpoint path [products]:
```

- **Press Enter**: Uses default (pluralized entity name)
- **Type custom**: Enter your endpoint path

### Step 6: Additional Options

#### For Full CRUD:

```
Skip dialog components? (y/n) [n]:
Skip filter component? (y/n) [n]:
```

#### For Basic CRUD:

```
Variable name (short name, e.g., "cat" for category) [auto]:
```

### Step 7: Review & Confirmation

Review all your selections:

```
═══════════════════════════════════════════════════════
                    Review Summary
═══════════════════════════════════════════════════════

CRUD Type: FULL
Package: @truths/inventory
Entity Name: product

Fields:
  1. name (string)
  2. price (number:currency)

Endpoint: products

═══════════════════════════════════════════════════════

Proceed with CRUD generation? (y/n) [y]:
```

- **Type `y` or press Enter**: Proceeds with generation
- **Type `n`**: Cancels and exits

### Step 8: Get Full Command Line (Non-Interactive)

After reviewing your selections in interactive mode, you'll see a **full command line** that you can copy and reuse. This allows you to:

- **Rerun the same CRUD generation** without going through all the prompts again
- **Batch create multiple similar CRUDs** by modifying the command
- **Share with team members** for consistent CRUD generation

**Example Full Command:**

```bash
npm run create-crud -- product --package inventory --type full --fields "name:string,price:number:currency" --endpoint products --no-interactive
```

**For Unified CRUD (with Tree support):**

```bash
node tools/create-crud-unified.cjs product --package inventory --mode basic --fields "name:string,price:number:currency,status:string" --no-interactive
```

**Command Breakdown:**

| Element | Description |
|---------|-------------|
| `product` | Entity name (first positional argument) |
| `--package inventory` | Target package name |
| `--type full` or `--mode basic` | CRUD type (basic/full or basic/tree) |
| `--fields "..."` | Comma-separated list of fields with types |
| `--endpoint products` | Custom API endpoint (optional) |
| `--no-interactive` | Disable interactive prompts |

**Field Format Examples:**

```bash
# String field
"name:string"

# Number with format
"price:number:currency"
"quantity:number:integer"
"rating:number:decimal"
"discount:number:percentage"

# Date with format
"created_at:date:datetime"
"birthday:date:date"
"last_login:date:timestamp"

# Boolean field
"is_active:boolean"

# Optional fields (add ? suffix)
"description:string?"
"notes:string?"

# Multiple fields (comma-separated, no spaces)
"code:string,name:string,price:number:currency,status:string"
```

**Tips:**

- Copy the command shown after review for future use
- Modify field names/types for similar CRUDs
- Add to your project's documentation or scripts
- Use in CI/CD pipelines for automated generation

## 🎯 Common Use Cases

### Create a Simple Product CRUD

```bash
npm run create-crud
```

Then follow prompts:

- Package: `inventory` (select from list)
- Entity: `product`
- Type: `1` (Basic CRUD)
- Fields: `name` (String), `price` (Number → Currency)
- Review and confirm

### Create a Full Order Management CRUD

```bash
npm run create-crud
```

Then follow prompts:

- Package: `sales` (select from list)
- Entity: `order`
- Type: `2` (Full CRUD)
- Fields:
  - `order_number` (String)
  - `total` (Number → Currency)
  - `status` (Enum)
  - `order_date` (Date → Date and Time)
- Review and confirm

### Skip Interactive Mode (Non-Interactive)

If you want to use command-line arguments instead:

```bash
npm run create-crud -- product --package inventory --type basic --fields "name:string,price:number:currency" --no-interactive
```

**Note**: In non-interactive mode, all required arguments must be provided.

## 📝 Field Type Reference

### Supported Types

| Type      | Description      | Example                              |
| --------- | ---------------- | ------------------------------------ |
| `string`  | Text field       | `name`, `description`, `code`        |
| `number`  | Numeric field    | `price`, `quantity`, `discount`      |
| `date`    | Date/time field  | `created_at`, `due_date`, `birthday` |
| `boolean` | True/false field | `is_active`, `is_published`          |
| `enum`    | Selection field  | `status`, `priority`, `type`         |

### Number Formats

| Format       | Description       | Use Case                   |
| ------------ | ----------------- | -------------------------- |
| `integer`    | Whole numbers     | `quantity`, `count`        |
| `decimal`    | Decimal numbers   | `weight`, `rating`         |
| `currency`   | Money values      | `price`, `total`, `amount` |
| `percentage` | Percentage values | `discount`, `tax_rate`     |

### Date Formats

| Format      | Description            | Use Case                   |
| ----------- | ---------------------- | -------------------------- |
| `date`      | Date only (YYYY-MM-DD) | `birthday`, `due_date`     |
| `datetime`  | Date and time          | `created_at`, `updated_at` |
| `timestamp` | Unix timestamp         | `last_login`               |
| `iso`       | ISO date string        | API responses              |

## 💡 Tips & Best Practices

### Field Naming

- Use **lowercase** with **underscores** for field names
- Examples: `first_name`, `order_date`, `is_active`
- Avoid: `FirstName`, `orderDate`, `isActive`

### Package Selection

- Always select from the list if the package exists
- Create packages first using `npm run create-package` if needed
- Package names should be lowercase with hyphens: `inventory`, `sales-order`

### Entity Naming

- Use **singular** form: `product`, `order`, `invoice`
- The tool automatically pluralizes for endpoints: `products`, `orders`, `invoices`
- Use kebab-case: `order-item`, `invoice-line`

### Field Collection

- Start with essential fields first
- You can always add more fields later by editing the generated files
- Use descriptive field names that match your backend API

### Review Before Generation

- Always review the summary before confirming
- Check that field types match your backend schema
- Verify package and entity names are correct

## 🔧 Troubleshooting

### Package Not Found

If you see "Package does not exist":

1. Create the package first:

   ```bash
   npm run create-package -- <package-name>
   ```

2. Then run CRUD creation again

### Entity Already Exists

If the entity module already exists:

1. Delete the existing directory:

   ```bash
   rm -rf packages/<package>/src/<entity-plural>/
   ```

2. Or use a different entity name

### Field Validation Errors

If you see field validation errors:

- Field names must be lowercase with underscores
- Examples: `name`, `first_name`, `order_date`
- Avoid: `Name`, `firstName`, `orderDate`

### TypeScript Errors After Generation

1. Restart your TypeScript server in your IDE
2. Verify types were added to `packages/<package>/src/types.ts`
3. Run type checking:
   ```bash
   npm run type-check --workspace=packages/<package>
   ```

## 📚 Next Steps

After creating your CRUD module:

1. **Review Generated Files**: Check all files in `packages/<package>/src/<entity-plural>/`

2. **Update Types**: Verify types in `types.ts` match your backend schema

3. **Implement Components**: Replace stub components with actual UI

4. **Configure Service**: Update provider with correct API endpoints

5. **Add Validation**: Enhance forms with specific validation rules

6. **Test**: Verify CRUD operations work correctly

## 🆘 Getting Help

- **Full Documentation**: See [README.md](./README.md) for complete documentation
- **Command Help**: Run `npm run create-crud -- --help`
- **Examples**: Check existing CRUD modules in `packages/account/src/users/` or `packages/inventory/src/`

---

**Happy Coding! 🎉**
