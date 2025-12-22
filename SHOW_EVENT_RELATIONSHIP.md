# Show and Event Relationship - Design Clarification

## Overview

This document clarifies how **Show** and **Event** entities should relate to each other in the ticket brokerage system.

## Current State

### Show (✅ Implemented)

- **Location**: `backend/app/domain/ticketing/show.py`
- **Type**: Master data / Template entity
- **Current Fields**:
  - `id`, `tenant_id`
  - `code` (optional, e.g., "HAMILTON-001")
  - `name` (e.g., "Hamilton")
  - `is_active`
  - `started_date` (optional, show start date)
  - `ended_date` (optional, show end date)
  - `attributes` (JSON for flexible data)

### Event (📋 Planned, Not Yet Implemented)

- **Location**: Planned in `backend/app/domain/events/`
- **Type**: Specific occurrence / Sellable instance
- **Planned Fields** (from `TICKET_SYSTEM_BRAINSTORM.md`):
  - `event_id`, `tenant_id`
  - `title`, `description`
  - `event_type_id` (references EventType: CONCERT, THEATER, SPORTS, etc.)
  - `venue_id` (where it happens)
  - `organizer_id` (who organizes it)
  - `start_datetime`, `end_datetime`, `timezone`
  - `status` (DRAFT, PUBLISHED, ON_SALE, SOLD_OUT, CANCELLED, COMPLETED)
  - `is_featured`, `image_urls`, `metadata`

## Recommended Relationship

### Option 1: Show → Event (One-to-Many) ⭐ **RECOMMENDED**

**Concept**: A Show is a production/template, and Events are specific performances of that show.

```
Show (Template/Production)
  ├── Event (March 15, 2024 at 7:00 PM)
  ├── Event (March 16, 2024 at 2:00 PM)
  └── Event (March 16, 2024 at 7:00 PM)
```

**Event Entity Should Include**:

```python
class Event(AggregateRoot):
    def __init__(
        self,
        tenant_id: str,
        show_id: str,  # ← Reference to Show
        event_type_id: str,
        venue_id: str,
        organizer_id: str,
        title: str,
        start_datetime: datetime,
        end_datetime: datetime,
        # ... other fields
    ):
```

**Benefits**:

- ✅ Clear separation: Show = "what", Event = "when/where"
- ✅ Reusable show information (description, images, etc.)
- ✅ Easy to find all performances of a show
- ✅ Common pattern in ticketing systems
- ✅ Matches the docstring: Show has "complex relationships"

**Use Cases**:

- "Show me all events for Hamilton"
- "Create a new event for Hamilton on March 20"
- "Update the show description (affects all events)"

### Option 2: Show and Event are Independent

**Concept**: Show is a separate categorization system, Event is standalone.

```
Show (Category/Genre)
  └── Used for filtering/categorization only

Event (Standalone)
  └── References EventType, Venue, Organizer
```

**Event Entity Would NOT Include**:

- No `show_id` field
- Event is completely independent

**When to Use**:

- If Show is meant to be a category/genre system
- If events don't belong to a specific "production"
- If you have one-off events (concerts, sports games) that aren't part of a "show"

### Option 3: Show is Optional on Event

**Concept**: Some events belong to a show, others don't.

```
Event
  ├── show_id (nullable) ← Optional reference
  ├── event_type_id
  ├── venue_id
  └── organizer_id
```

**Benefits**:

- ✅ Flexible: supports both show-based and standalone events
- ✅ Can handle: "Hamilton" (show) vs "Taylor Swift Concert" (standalone event)

**Trade-offs**:

- More complex queries
- Need to handle null show_id cases

## Recommendation: Option 1 (Show → Event)

Based on the ticket brokerage context and the Show entity's docstring mentioning "complex relationships", **Option 1 is recommended**.

### Implementation Plan

1. **Add `show_id` to Event Entity**:

   ```python
   class Event(AggregateRoot):
       show_id: str  # Required reference to Show
       # ... other fields
   ```

2. **Update Show Entity** (if needed):

   - Add methods to get related events
   - Add validation: can't delete show if events exist

3. **Database Schema**:

   ```sql
   CREATE TABLE events (
       id VARCHAR PRIMARY KEY,
       tenant_id VARCHAR NOT NULL,
       show_id VARCHAR NOT NULL,  -- Foreign key to shows
       event_type_id VARCHAR NOT NULL,
       venue_id VARCHAR NOT NULL,
       organizer_id VARCHAR NOT NULL,
       title VARCHAR NOT NULL,
       start_datetime TIMESTAMP NOT NULL,
       end_datetime TIMESTAMP NOT NULL,
       -- ... other fields
       FOREIGN KEY (show_id) REFERENCES shows(id),
       FOREIGN KEY (event_type_id) REFERENCES event_types(id),
       FOREIGN KEY (venue_id) REFERENCES venues(id),
       FOREIGN KEY (organizer_id) REFERENCES organizers(id)
   );
   ```

4. **Business Rules**:
   - Event must reference an active Show
   - Cannot delete a Show if it has active Events
   - Show information (name, description) can be inherited by Events
   - Event can override Show title if needed

## Entity Hierarchy

```
Show (Production Template)
  ├── name: "Hamilton"
  ├── code: "HAMILTON-001"
  └── attributes: { description, images, etc. }
      │
      ├── Event #1
      │   ├── show_id: <show.id>
      │   ├── title: "Hamilton" (or can override)
      │   ├── start_datetime: 2024-03-15 19:00
      │   ├── venue_id: <theater-a>
      │   └── status: ON_SALE
      │
      ├── Event #2
      │   ├── show_id: <show.id>
      │   ├── title: "Hamilton"
      │   ├── start_datetime: 2024-03-16 14:00
      │   ├── venue_id: <theater-a>
      │   └── status: ON_SALE
      │
      └── Event #3
          ├── show_id: <show.id>
          ├── title: "Hamilton"
          ├── start_datetime: 2024-03-16 19:00
          ├── venue_id: <theater-a>
          └── status: SOLD_OUT
```

## Related Entities Flow

```
Show
  ↓ (one-to-many)
Event
  ↓ (one-to-many)
EventSeat (event-specific seat pricing & ownership)
  ↓ (one-to-one)
Ticket (sold seat)
  ↓ (many-to-one)
Booking (customer purchase)
```

## API Examples

### Creating an Event for a Show

```python
POST /ticketing/events
{
    "show_id": "show-123",
    "event_type_id": "event-type-456",
    "venue_id": "venue-789",
    "organizer_id": "organizer-101",
    "title": "Hamilton",  # Can inherit from Show or override
    "start_datetime": "2024-03-15T19:00:00Z",
    "end_datetime": "2024-03-15T21:30:00Z",
    "timezone": "America/New_York"
}
```

### Getting All Events for a Show

```python
GET /ticketing/shows/{show_id}/events
```

### Getting Show Details with Events

```python
GET /ticketing/shows/{show_id}
{
    "id": "show-123",
    "name": "Hamilton",
    "code": "HAMILTON-001",
    "events": [
        {
            "id": "event-1",
            "title": "Hamilton",
            "start_datetime": "2024-03-15T19:00:00Z",
            "status": "ON_SALE"
        },
        // ... more events
    ]
}
```

## Migration Strategy

If you choose Option 1, when implementing Event:

1. ✅ Keep Show as-is (already implemented)
2. 📋 Implement Event with `show_id` field
3. 📋 Add foreign key constraint in database
4. 📋 Add validation in Event creation
5. 📋 Add business rules (can't delete show with events)
6. 📋 Update Show repository to support event queries
7. 📋 Add API endpoints for show → events relationship

## Questions to Consider

1. **Can an Event exist without a Show?**

   - If NO → Use Option 1 (show_id required)
   - If YES → Use Option 3 (show_id nullable)

2. **Is Show a production template or a category?**

   - Template → Option 1 (one-to-many with Event)
   - Category → Option 2 (independent, used for filtering)

3. **Do you need to track show-level analytics?**
   - YES → Option 1 makes this easier
   - NO → Any option works

## Conclusion

**Recommended**: **Option 1 - Show → Event (One-to-Many)**

This provides:

- Clear business model (Show = production, Event = performance)
- Reusable show information
- Easy querying and analytics
- Matches common ticketing system patterns
- Aligns with Show's "complex relationships" description

The Event entity should include a required `show_id` field that references the Show entity.
