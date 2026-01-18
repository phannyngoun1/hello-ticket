# Audit Logs Component

A reusable React component for displaying audit logs across different entities in the Truths platform.

## Features

- **Entity-Specific**: Filter logs by entity type and ID
- **Chronological Display**: Shows newest activities first
- **Rich Event Types**: Visual badges for different event types (create, update, delete, read, etc.)
- **Severity Indicators**: Color-coded severity levels
- **User Attribution**: Shows who performed each action
- **Expandable Details**: Click to see before/after values, changed fields, and metadata
- **Responsive Design**: Works on desktop and mobile
- **Loading States**: Skeleton loading and error states
- **Pagination**: Load more functionality for large datasets

## API Integration

The component supports both prop-based data and automatic API fetching:

### Using Props (Controlled)

```tsx
import { AuditLogs } from '@truths/custom-ui';

const [logs, setLogs] = useState<AuditLogEntry[]>([]);
const [loading, setLoading] = useState(false);

// Fetch logs manually
const loadLogs = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/audit/user-activity?entity_type=event&entity_id=123');
    const data = await response.json();
    setLogs(data.items);
  } finally {
    setLoading(false);
  }
};

<AuditLogs
  entityType="event"
  entityId="123"
  logs={logs}
  loading={loading}
  onRefresh={loadLogs}
/>
```

### Using API Hook (Uncontrolled)

```tsx
import { useAuditLogs } from '@truths/custom-ui';

function AuditLogsView({ entityType, entityId }: { entityType: string, entityId: string }) {
  const {
    logs,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  } = useAuditLogs(entityType, entityId);

  return (
    <AuditLogs
      entityType={entityType}
      entityId={entityId}
      logs={logs}
      loading={loading}
      error={error}
      hasMore={hasMore}
      onLoadMore={loadMore}
      onRefresh={refresh}
    />
  );
}
```

### Direct API Usage

```tsx
import { AuditLogsService } from '@truths/custom-ui';

const service = new AuditLogsService();

// Fetch logs with filters
const logs = await service.getAuditLogs({
  entity_type: 'event',
  entity_id: '123',
  limit: 50,
  event_types: ['create', 'update'],
  date_from: '2024-01-01',
  date_to: '2024-01-31'
});
```

## API Integration

The component supports both prop-based data and automatic API fetching:

### Using Props (Controlled)

```tsx
import { AuditLogs } from '@truths/custom-ui';

const [logs, setLogs] = useState<AuditLogEntry[]>([]);
const [loading, setLoading] = useState(false);

// Fetch logs manually
const loadLogs = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/audit/user-activity?entity_type=event&entity_id=123');
    const data = await response.json();
    setLogs(data.items);
  } finally {
    setLoading(false);
  }
};

<AuditLogs
  entityType="event"
  entityId="123"
  logs={logs}
  loading={loading}
  onRefresh={loadLogs}
/>
```

### Using API Hook (Uncontrolled)

```tsx
import { useAuditLogs } from '@truths/custom-ui';

function AuditLogsView({ entityType, entityId }: { entityType: string, entityId: string }) {
  const {
    logs,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  } = useAuditLogs(entityType, entityId);

  return (
    <AuditLogs
      entityType={entityType}
      entityId={entityId}
      logs={logs}
      loading={loading}
      error={error}
      hasMore={hasMore}
      onLoadMore={loadMore}
      onRefresh={refresh}
    />
  );
}
```

### Direct API Usage

```tsx
import { AuditLogsService } from '@truths/custom-ui';

const service = new AuditLogsService();

// Fetch logs with filters
const logs = await service.getAuditLogs({
  entity_type: 'event',
  entity_id: '123',
  limit: 50,
  event_types: ['create', 'update'],
  date_from: '2024-01-01',
  date_to: '2024-01-31'
});
```

## Usage

### Basic Usage

```tsx
import { AuditLogs } from '@truths/custom-ui';

function EventDetails({ eventId }: { eventId: string }) {
  return (
    <div>
      <h1>Event Details</h1>

      {/* Other event content */}

      <AuditLogs
        entityType="event"
        entityId={eventId}
        title="Event Activity"
        description="Recent changes and access to this event"
      />
    </div>
  );
}
```

### Advanced Usage with Custom Data

```tsx
import { AuditLogs, type AuditLogEntry } from '@truths/custom-ui';

function UserProfile({ userId }: { userId: string }) {
  // Fetch audit logs from API
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const loadLogs = async () => {
    try {
      const response = await fetch(`/api/audit/user-activity?entity_id=${userId}&entity_type=user`);
      const data = await response.json();
      setLogs(data.items);
      setHasMore(data.has_next);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [userId]);

  return (
    <div className="space-y-6">
      <h1>User Profile</h1>

      <AuditLogs
        entityType="user"
        entityId={userId}
        title="Account Activity"
        description="Login history, profile changes, and account events"
        logs={logs} // Custom logs data
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadLogs}
        className="max-h-96"
      />
    </div>
  );
}
```

### Integration with Backend API

```tsx
// Using the audit API endpoints
const fetchAuditLogs = async (entityType: string, entityId: string, limit = 50) => {
  const response = await fetch(
    `/api/audit/user-activity?entity_type=${entityType}&entity_id=${entityId}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch audit logs');
  }

  return response.json();
};

// Usage in component
const AuditLogsSection = ({ entityType, entityId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs(entityType, entityId)
      .then(data => setLogs(data))
      .catch(error => console.error('Audit logs error:', error))
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  return (
    <AuditLogs
      entityType={entityType}
      entityId={entityId}
      logs={logs}
      loading={loading}
    />
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entityType` | `string` | - | Type of entity (e.g., "event", "user", "booking") |
| `entityId` | `string` | - | ID of the specific entity |
| `title` | `string` | `"Audit Logs"` | Section title |
| `description` | `string` | `"Activity history for this entity"` | Section description |
| `limit` | `number` | `50` | Maximum logs to display initially |
| `showLoadMore` | `boolean` | `true` | Show "Load More" button |
| `className` | `string` | - | Additional CSS classes |
| `loading` | `boolean` | `false` | Loading state |
| `error` | `string` | - | Error message |
| `onLoadMore` | `() => void` | - | Load more callback |
| `hasMore` | `boolean` | `false` | Whether more logs are available |
| `showFilters` | `boolean` | `true` | Whether to show filter controls |
| `showRefresh` | `boolean` | `true` | Whether to show refresh button |
| `onRefresh` | `() => void` | - | Callback when refresh is clicked |
| `filters` | `AuditLogFilters` | - | Current filter values |
| `onFiltersChange` | `(filters: AuditLogFilters) => void` | - | Callback when filters change |
| `showSorting` | `boolean` | `true` | Whether to show sorting controls |
| `sorting` | `AuditLogSorting` | - | Current sorting configuration |
| `onSortingChange` | `(sorting: AuditLogSorting) => void` | - | Callback when sorting changes |
| `logs` | `AuditLogEntry[]` | - | Array of audit log entries to display |

## Sorting

The component supports comprehensive sorting capabilities:

### Available Sort Fields

- **Timestamp**: Sort by when the audit log was created (default)
- **Event Timestamp**: Sort by when the actual event occurred
- **Event Type**: Sort alphabetically by event type
- **Severity**: Sort by severity level (Low to Critical)
- **User Email**: Sort alphabetically by user
- **Description**: Sort alphabetically by description

### Sort Directions

- **Ascending (↑)**: A-Z, Oldest first, Low to High
- **Descending (↓)**: Z-A, Newest first, High to Low

### Sort Interface

Sorting is controlled via a dropdown in the header that shows current sort field and direction. Clicking the same field toggles between ascending and descending order.

### Example Usage with Sorting

```tsx
const [sorting, setSorting] = useState<AuditLogSorting>({
  field: 'timestamp',
  direction: 'desc'
});

const handleSortingChange = (newSorting: AuditLogSorting) => {
  setSorting(newSorting);
  // Refetch with new sorting
  loadLogs(filters, newSorting);
};

<AuditLogs
  entityType="event"
  entityId={eventId}
  sorting={sorting}
  onSortingChange={handleSortingChange}
/>
```

## Filtering

The component supports advanced filtering capabilities:

### Available Filters

- **Event Types**: Filter by create, update, delete, read operations
- **Severity Levels**: Filter by low, medium, high, critical severity
- **User Email**: Search for activities by specific user
- **Date Range**: Filter activities within date ranges
- **Description Search**: Search within activity descriptions

### Filter Interface

Filters are accessed via a popover triggered by the "Filters" button. Active filters are indicated by a badge, and all filters can be cleared at once.

### Example Usage with Filters

```tsx
const [filters, setFilters] = useState<AuditLogFilters>({});
const [logs, setLogs] = useState<AuditLogEntry[]>([]);

const loadLogs = async (currentFilters = filters) => {
  const response = await fetch(`/api/audit/user-activity?entity_type=event&entity_id=${eventId}&filters=${JSON.stringify(currentFilters)}`);
  const data = await response.json();
  setLogs(data.logs);
};

const handleFiltersChange = (newFilters: AuditLogFilters) => {
  setFilters(newFilters);
  // Refetch logs with new filters
  loadLogs(newFilters);
};

const handleRefresh = () => {
  loadLogs(filters); // Refresh with current filters
};

<AuditLogs
  entityType="event"
  entityId={eventId}
  logs={logs}
  filters={filters}
  onFiltersChange={handleFiltersChange}
  onRefresh={handleRefresh}
/>
```

## Refresh Functionality

The refresh button allows users to reload audit logs without losing current filters. The button shows a spinning animation during loading.

## Event Types

The component automatically recognizes these event types:

- `create` - Entity creation
- `update` - Entity modification
- `delete` - Entity deletion
- `read` - Entity access/view
- `login` - User login
- `logout` - User logout

## Severity Levels

- `low` - Informational actions
- `medium` - Normal business operations
- `high` - Critical actions
- `critical` - System-impacting events

## Styling

The component uses Tailwind CSS classes and integrates with the `@truths/ui` design system. It includes:

- Card-based layout
- Responsive design
- Hover effects
- Expandable sections
- Color-coded badges
- Loading skeletons

## Accessibility

- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Focus management for expandable sections

## API Integration

The component expects audit log data in this format:

```typescript
interface AuditLogEntry {
  event_id: string;
  timestamp: string;
  event_timestamp?: string;
  event_type: string;
  severity: "low" | "medium" | "high" | "critical";
  entity_type: string;
  entity_id: string;
  user_id?: string;
  user_email?: string;
  session_id?: string;
  request_id?: string;
  ip_address?: string;
  user_agent?: string;
  description: string;
  metadata: Record<string, any>;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changed_fields?: string[];
}

interface AuditLogSorting {
  field: 'timestamp' | 'event_timestamp' | 'event_type' | 'severity' | 'user_email' | 'description';
  direction: 'asc' | 'desc';
}
```

This matches the backend API response format from `/api/audit/user-activity`.