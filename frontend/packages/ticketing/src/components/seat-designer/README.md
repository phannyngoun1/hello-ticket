# Seat Designer Module Structure

This folder contains the refactored Seat Designer component and related files.

## Current Structure

- **seat-designer.tsx** - Main SeatDesigner component (moved from parent directory)

- **layout-canvas.tsx** - Konva-based canvas component for rendering seats and sections (moved from parent directory)

- **seat-viewer.tsx** - Seat viewer component for displaying seats (moved from parent directory)

- **placement-panel.tsx** - Reusable placement panel component (moved from parent directory)

- **types.ts** - All TypeScript interfaces and types:
  - `SeatDesignerProps` - Main component props
  - `SectionMarker` - Section marker data structure
  - `SeatInfo` - Seat information structure
  - `SeatMarker` - Seat marker data structure

- **utils.ts** - Utility functions:
  - `getUniqueSections()` - Get unique sections from seats and API data
  - `findSectionId()` - Find section ID from section name

- **index.ts** - Module exports (exports all public APIs)

## Future Refactoring

The main `seat-designer.tsx` file (2700+ lines) can be further broken down into:

1. **hooks.ts** - Custom hooks for mutations, queries, and state management
2. **seat-edit-sheet.tsx** - Seat editing form component
3. **section-management-sheet.tsx** - Section management UI
4. **section-form-sheet.tsx** - Section creation/editing form
5. **seat-placement-controls.tsx** - Controls for placing seats
6. **section-placement-controls.tsx** - Controls for placing sections
7. **datasheet-view.tsx** - Datasheet view component
8. **image-upload-controls.tsx** - Image upload UI

## Usage

```typescript
import { SeatDesigner } from "@truths/ticketing/seats";
// or
import { SeatDesigner, type SeatDesignerProps } from "@truths/ticketing/seats";
```
