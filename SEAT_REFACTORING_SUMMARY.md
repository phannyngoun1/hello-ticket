# Seat Model Refactoring: section → section_id

## Summary
Refactored the `Seat` model to use `section_id` (foreign key reference to `sections` table) instead of `section` (string field). This change normalizes the database schema and ensures referential integrity.

## Changes Made

### 1. Database Model (`models.py`)
- **File**: `backend/app/infrastructure/shared/database/models.py`
- Changed `SeatModel.section: str` to `SeatModel.section_id: str`
- Added foreign key constraint: `foreign_key="sections.id"`
- Updated unique index from `('layout_id', 'section', 'row', 'seat_number')` to `('layout_id', 'section_id', 'row', 'seat_number')`
- Added new index: `ix_seats_section` on `('tenant_id', 'section_id')`

### 2. Domain Entity (`seat.py`)
- **File**: `backend/app/domain/ticketing/seat.py`
- Changed `Seat.section: str` to `Seat.section_id: str`
- Renamed `_validate_section()` to `_validate_section_id()`
- Updated `update_details()` method signature to use `section_id` parameter

### 3. Mapper (`mapper_seat.py`)
- **File**: `backend/app/infrastructure/ticketing/mapper_seat.py`
- Updated `to_model()`: changed `section=seat.section` to `section_id=seat.section_id`
- Updated `to_domain()`: changed `section=model.section` to `section_id=model.section_id`

### 4. Commands (`commands_seat.py`)
- **File**: `backend/app/application/ticketing/commands_seat.py`
- `CreateSeatCommand`: changed `section: str` to `section_id: str`
- `UpdateSeatCommand`: changed `section: Optional[str]` to `section_id: Optional[str]`

### 5. Schemas (`schemas_seat.py`)
- **File**: `backend/app/presentation/api/ticketing/schemas_seat.py`
- `SeatCreateRequest`: changed `section` field to `section_id`
- `SeatUpdateRequest`: changed `section` field to `section_id`
- `SeatResponse`: changed `section` field to `section_id`

### 6. Handlers (`handlers_seat.py`)
- **File**: `backend/app/application/ticketing/handlers_seat.py`
- Updated `handle_create_seat()` to use `section_id` instead of `section`
- Changed from `get_by_venue_and_location()` to `get_by_layout_and_location()` for duplicate checks
- Updated `handle_update_seat()` to use `section_id` in conflict checking
- Updated `handle_bulk_create_seats()` to use `section_id` throughout
- Updated all seat creation/update logic to reference `section_id`

### 7. Repository (`seat_repository.py`)
- **File**: `backend/app/infrastructure/ticketing/seat_repository.py`
- Updated `get_by_venue_and_location()` to use `section_id` (marked as DEPRECATED)
- Updated `get_by_layout_and_location()` to use `section_id` parameter

### 8. Queries (`queries_seat.py`)
- **File**: `backend/app/application/ticketing/queries_seat.py`
- `GetSeatByLocationQuery`: changed `section: str` to `section_id: str`

### 9. Routes (`seat_routes.py`)
- **File**: `backend/app/presentation/ticketing/seat_routes.py`
- Updated `create_seat()` to pass `section_id` instead of `section`
- Updated `update_seat()` to pass `section_id` instead of `section`

### 10. API Mapper (`mapper_venue.py`)
- **File**: `backend/app/presentation/api/ticketing/mapper_venue.py`
- Updated `seat_to_response()` to map `section_id` instead of `section`

### 11. Database Migration
- **Files**: 
  - `backend/migrations/017_change_seat_section_to_section_id.sql`
  - `backend/migrations/017_change_seat_section_to_section_id.py`

#### Migration Steps:
1. Add new `section_id` column (nullable)
2. Create `sections` records from existing seat `section` strings
3. Populate `section_id` values based on section name lookup
4. Make `section_id` NOT NULL
5. Add foreign key constraint to `sections` table
6. Drop old unique index `ix_seats_location`
7. Create new unique index with `section_id`
8. Create index for `section_id` lookups
9. Drop old `section` column

## Running the Migration

To apply this migration:

```bash
cd /Users/ngounphanny/dev/envs/projects/ticket-system/backend
python migrations/017_change_seat_section_to_section_id.py
```

## Impact Analysis

### Breaking Changes
- **API Changes**: All seat-related API endpoints now require/return `section_id` instead of `section`
- **Database Schema**: The `seats` table structure has changed
- **Frontend**: Any frontend code using seat data will need to be updated to use `section_id` instead of `section`

### Benefits
1. **Data Integrity**: Foreign key constraints ensure that seats can only reference valid sections
2. **Normalized Schema**: Eliminates redundant section name storage
3. **Better Performance**: Foreign key relationships enable better query optimization
4. **Referential Integrity**: Prevents orphaned seats when sections are deleted (ON DELETE RESTRICT)

### Considerations
- Existing seat data will be automatically migrated to create corresponding section records
- The migration creates sections for each unique `(layout_id, section_name)` combination
- Section names will be preserved in the new `sections.name` field

## Testing Recommendations

1. **Test Migration**: Run migration on a test database first
2. **Test API Endpoints**: Verify all seat CRUD operations work with `section_id`
3. **Test Foreign Key Constraints**: Ensure cascade rules work correctly
4. **Test Bulk Operations**: Verify bulk seat creation/update handles `section_id` properly
5. **Test Frontend Integration**: Update frontend to use `section_id` and verify seat designer works

## Files Modified

### Backend
Total backend files changed: 12
- 11 Python files (backend logic)
- 2 Migration files (SQL + Python)

### Frontend
Files changed: 1 (TypeScript types)

**Additional Frontend Files Requiring Updates:**
- `frontend/packages/ticketing/src/seats/seat-designer.tsx` - Update all `section` references to `section_id`
- `frontend/packages/ticketing/src/seats/layout-canvas.tsx` - Update seat rendering logic
- `frontend/packages/ticketing/src/layouts/layout-service.ts` - Update seat service calls

**Note**: The frontend changes are partially complete. The TypeScript types have been updated, but the component implementations still need to be updated to use `section_id` instead of `section`. This will require:
1. Updating state management to use `section_id`
2. Changing form inputs to use section dropdowns/selects that provide `section_id`
3. Updating all seat creation/update logic to pass `section_id`
4. Updating seat display logic to fetch and display section names using `section_id`

## Related Documentation

- See `backend/app/infrastructure/shared/database/models.py` for updated model definition
- See `backend/migrations/017_change_seat_section_to_section_id.sql` for migration SQL

