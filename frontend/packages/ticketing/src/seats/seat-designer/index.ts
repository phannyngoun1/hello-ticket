/**
 * Seat Designer - Module Exports
 * 
 * This module provides the Seat Designer component and related utilities.
 * 
 * Structure:
 * - seat-designer.tsx: Main SeatDesigner component
 * - layout-canvas.tsx: Konva-based canvas component
 * - seat-viewer.tsx: Seat viewer component
 * - placement-panel.tsx: Placement panel component
 * - types.ts: Type definitions and interfaces
 * - utils.ts: Utility functions
 */

// Export main component (from seat-designer.tsx)
export { SeatDesigner } from "./seat-designer";

// Export viewer component
export { SeatViewer } from "./seat-viewer";
export type { SeatViewerProps } from "./seat-viewer";

// Export placement panel component
export { PlacementPanel } from "./placement-panel";
export type { PlacementPanelProps } from "./placement-panel";

// Export types
export type {
    SeatDesignerProps,
    SectionMarker,
    SeatInfo,
    SeatMarker,
} from "./types";

// Export utils
export { getUniqueSections, findSectionId } from "./utils";

// Export layout canvas component
export { LayoutCanvas } from "./layout-canvas";

// Export components
export * from "./components";
