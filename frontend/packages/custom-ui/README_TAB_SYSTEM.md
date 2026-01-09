# Tab System - Practical Approach

## Overview

The tab system now follows a **practical, application-level configuration approach** where business logic is kept separate from reusable UI components. This makes the component library truly reusable across different projects.

## Architecture

### ❌ **Before (Not Practical)**
```typescript
// Hardcoded in reusable component library
export const venueTabs = { /* business logic in UI library */ };
```

### ✅ **After (Practical)**
```typescript
// Application-level configuration
// venue-tabs-config.ts
export const venueTabConfigs = [/* business logic in app */];

// Reusable UI component (no business logic)
<CustomTabs variant="underline">
  {/* Pure UI, no hardcoded business rules */}
</CustomTabs>
```

## Quick Start

### 1. Create Application Tab Configuration

```typescript
// src/venues/venue-tabs-config.ts
export const venueTabConfigs = [
  { value: "layout", label: "Layout", icon: LayoutGrid, show: true },
  { value: "overview", label: "Overview", icon: Info, show: true },
  { value: "contact", label: "Contact", icon: Phone, show: true },
  { value: "metadata", label: "Metadata", icon: Database, show: (hasMetadata) => hasMetadata },
];

export function getVenueTabs(hasMetadata: boolean) {
  return venueTabConfigs.filter(tab =>
    typeof tab.show === 'function' ? tab.show(hasMetadata) : tab.show
  );
}

export function getVenueTabContent(tabValue: string, data: Venue, ...deps) {
  switch (tabValue) {
    case "overview": return <OverviewContent data={data} />;
    case "contact": return <ContactContent data={data} />;
    // ... business logic here, not in UI library
  }
}
```

### 2. Use in Component

```typescript
// src/venues/venue-detail.tsx
import { getVenueTabs, getVenueTabContent } from './venue-tabs-config';
import { CustomTabs, CustomTabsList, CustomTabsTrigger, CustomTabsContent } from "@truths/custom-ui";

function VenueDetail({ data }) {
  const tabConfigs = useMemo(() => getVenueTabs(hasMetadata), [hasMetadata]);

  return (
    <CustomTabs variant="underline">
      <CustomTabsList>
        {tabConfigs.map(tab => (
          <CustomTabsTrigger key={tab.value} value={tab.value} icon={tab.icon}>
            {tab.label}
          </CustomTabsTrigger>
        ))}
      </CustomTabsList>

      {tabConfigs.map(tab => (
        <CustomTabsContent key={tab.value} value={tab.value}>
          {getVenueTabContent(tab.value, data)}
        </CustomTabsContent>
      ))}
    </CustomTabs>
  );
}
```

## Benefits

### ✅ **Truly Reusable**
- UI library contains only UI logic
- Business logic stays in application
- Can be used across different projects

### ✅ **Maintainable**
- Business rules are co-located with business code
- Easy to modify without touching shared components
- Clear separation of concerns

### ✅ **Flexible**
- Each application can define its own tabs
- Easy to add/remove tabs per application
- No coupling between UI and business logic

### ✅ **Type Safe**
- Full TypeScript support
- Application-specific types
- Compile-time validation

## Patterns

### Conditional Tabs
```typescript
const venueTabConfigs = [
  { value: "basic", label: "Basic", show: true },
  { value: "admin", label: "Admin", show: (hasPermission) => hasPermission },
  { value: "debug", label: "Debug", show: (isDev) => isDev },
];
```

### Dynamic Content
```typescript
function getTabContent(tabValue: string, data: Entity, user: User) {
  // Access to full application context
  switch (tabValue) {
    case "profile": return <ProfileTab data={data} user={user} />;
    case "permissions": return user.isAdmin ? <PermissionsTab /> : null;
  }
}
```

### Feature Flags
```typescript
const tabConfigs = [
  { value: "new-feature", show: () => featureFlags.newFeature },
];
```

## Migration from Old System

### Remove Deprecated Imports
```typescript
// ❌ Old
import { venueTabs, getPageTabs } from "@truths/custom-ui";

// ✅ New
import { getVenueTabs, getVenueTabContent } from "./venue-tabs-config";
```

### Update Component Structure
```typescript
// ❌ Old - hardcoded in library
const tabs = getPageTabs("venue");

// ✅ New - application controlled
const tabs = getVenueTabs(hasMetadata);
```

## Best Practices

1. **Keep UI Generic**: Reusable components should only handle presentation
2. **Application Logic in App**: Business rules belong in application code
3. **Co-locate Related Code**: Tab configs next to components that use them
4. **Use TypeScript**: Full type safety for better maintainability
5. **Test Business Logic**: Unit tests for tab visibility and content logic

## Examples

See `packages/ticketing/src/venues/venue-tabs-config.ts` for a complete working example.