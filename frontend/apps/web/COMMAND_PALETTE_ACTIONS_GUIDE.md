# Command Palette Quick Actions Guide

This guide explains how the command palette quick actions work and how to configure new actions.

## Overview

Quick actions are shortcuts that appear in the command palette (opened with `Cmd+K` / `Ctrl+K`) that allow users to quickly perform common tasks like creating new entities.

## Current Implementation

### How "Add New User" Works

The "Add New User" action is configured in `frontend/apps/web/src/services/command-palette/quick-actions.ts`:

```typescript
{
  icon: User,
  label: "Add New User",
  value: "action-add-user",
  action: () => {
    if (navigate) {
      navigate({ to: "/users?action=create" });
    }
  },
}
```

When a user selects this action:
1. The command palette navigates to `/users?action=create`
2. The `UsersPage` component reads the `action=create` query parameter
3. The page automatically opens the create dialog

### How It's Wired Up

1. **Quick Actions Definition** (`quick-actions.ts`):
   - Defines all app-specific quick actions
   - Each action has an icon, label, value, and action callback

2. **Hook** (`use-app-command-palette.ts`):
   - Calls `getAppQuickActions(navigate)` to get the actions
   - Returns them as part of the hook result

3. **Component Chain**:
   - `RootLayout` → `AppCommandPalette` → `CommandPalette`
   - Quick actions are passed through props at each level

4. **Command Palette** (`CommandPalette.tsx`):
   - Filters actions based on search query
   - Displays actions when scope is "all" or "actions"
   - Executes the action callback when selected

## Adding New Actions

### Example: Add New Customer

The "Add New Customer" action is already configured:

```typescript
{
  icon: ShoppingCart,
  label: "Add New Customer",
  value: "action-add-customer",
  action: () => {
    if (navigate) {
      navigate({ to: "/sales/customers?action=create" });
    }
  },
}
```

### Example: Add New Purchase Order

The "Add New Purchase Order" action is already configured:

```typescript
{
  icon: FileText,
  label: "Add New Purchase Order",
  value: "action-add-purchase-order",
  action: () => {
    if (navigate) {
      navigate({ to: "/purchasing/purchase-orders?action=create" });
    }
  },
}
```

## How to Add More Actions

### Step 1: Add the Action to `quick-actions.ts`

Edit `frontend/apps/web/src/services/command-palette/quick-actions.ts`:

```typescript
import { User, ShoppingCart, FileText, YourIcon } from "lucide-react";

export function getAppQuickActions(
  navigate?: (options: { to: string }) => void
): QuickAction[] {
  return [
    // ... existing actions ...
    {
      icon: YourIcon,
      label: "Add New [Entity]",
      value: "action-add-[entity]",
      keywords: ["entity", "ent", "abbreviation"], // Optional: add search keywords
      action: () => {
        if (navigate) {
          navigate({ to: "/your/route?action=create" });
        }
      },
    },
  ];
}
```

**Note**: The `keywords` property is optional but recommended. It helps users find actions using:
- Common abbreviations (e.g., "cust" for customer)
- Alternative names (e.g., "client" for customer)
- Short forms (e.g., "po" for purchase order)

### Step 2: Add Keywords to Navigation Items

Navigation items get keywords from the server-side `routes.json` file. To add keywords for a new navigation item:

Edit `backend/app/presentation/core/routes/routes.json`:

```json
{
  "label": "Your Entity",
  "path": "/your/route",
  "icon": "YourIcon",
  "description": "Description here",
  "keywords": ["keyword1", "keyword2", "abbreviation"]
}
```

**Benefits of server-side keywords:**
- Single source of truth (same file as navigation structure)
- No frontend deployment needed to update keywords
- Can be dynamically generated or filtered based on permissions in the future
- Consistent with how navigation items are managed

The keywords are automatically passed through from the server response to the frontend navigation items.

### Step 2: Ensure Your Page Supports `action=create`

Your page component should read the query parameter and open the create dialog:

```typescript
export function YourEntityPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const autoOpenCreate = searchParams.get("action") === "create";

  return (
    <div className="space-y-4">
      <YourEntityListContainer
        autoOpenCreate={autoOpenCreate}
        onCreateDialogClose={() =>
          navigate({ to: "/your/route", search: {} })
        }
      />
    </div>
  );
}
```

### Step 3: Choose an Appropriate Icon

Use icons from `lucide-react`. Common choices:
- `User` - for users/people
- `ShoppingCart` - for customers/sales
- `FileText` - for documents/orders
- `Boxes` - for inventory/items
- `Building2` - for vendors/companies
- `ClipboardList` - for lists/orders

## Using Actions in the Command Palette

### Accessing Actions

1. Open command palette: `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
2. Type `action:` to filter to actions only
3. Or type the action name or keywords (e.g., "cust" will match "Add New Customer")
4. Select the action to execute it

### Action Scope

Actions are shown when:
- Scope is "all" (default)
- Scope is "actions" (type `action:`)
- Search query matches the action label, keywords, or value

### Enhanced Search Matching

The command palette now supports intelligent partial matching:

- **Navigation Items**: Searches in label, description, parent label, path, value, and keywords
  - Example: Typing "cust" will match "Customers" navigation item (from Sales > Customers)
  - Keywords are automatically added based on path mapping (see below)
  
- **Quick Actions**: Searches in label, keywords, and value
  - Example: Typing "cust" will match "Add New Customer" action
  - Keywords include common abbreviations and synonyms:
    - Customer: "customer", "cust", "client", "cus"
    - Purchase Order: "purchase", "purchase order", "po", "purch", "order"
    - User: "user", "usr", "people", "person"

## File Structure

```
frontend/apps/web/src/
├── services/
│   └── command-palette/
│       └── quick-actions.ts          # Define all quick actions here
├── hooks/
│   └── use-app-command-palette.ts    # Hook that provides actions and navigation
└── components/
    ├── app-command-palette/
    │   ├── index.tsx                  # Wrapper component
    │   └── types.ts                   # Type definitions
    └── layouts/
        └── root-layout.tsx            # Uses the hook and passes props

backend/app/presentation/core/routes/
└── routes.json                        # Navigation items with keywords (server-side)
```

## Type Definitions

```typescript
interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;        // Display name
  value: string;       // Unique identifier
  action: () => void;  // Callback to execute
  keywords?: string[];  // Optional: Additional search keywords for better matching
}

interface NavigationItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  path: string;
  shortcut?: string;
  description?: string;
  children?: NavigationItem[];
  parentLabel?: string;
  keywords?: string[];  // Optional: Additional search keywords for better matching
}
```

## Best Practices

1. **Consistent Naming**: Use `action-add-[entity]` format for values
2. **Clear Labels**: Use "Add New [Entity]" format for labels
3. **Appropriate Icons**: Choose icons that match the entity type
4. **Navigation Pattern**: Use `?action=create` query parameter pattern
5. **Error Handling**: Ensure the navigate function exists before calling
6. **Search Keywords**: Add `keywords` array with common abbreviations and synonyms to improve discoverability
   - Include the full entity name
   - Include common abbreviations (e.g., "cust" for customer, "po" for purchase order)
   - Include alternative names (e.g., "client" for customer)

## Troubleshooting

### Action Not Appearing

1. Check that the action is in `getAppQuickActions()`
2. Verify the hook returns `quickActions` in its result
3. Ensure `AppCommandPalette` receives and passes `quickActions` prop
4. Check browser console for errors

### Action Not Navigating

1. Verify the route path is correct
2. Ensure the page component reads `action=create` parameter
3. Check that the navigate function is passed correctly
4. Verify the route exists in your router configuration

