/**
 * Event Inventory Viewer – Color constants for sections and seats
 *
 * This file imports and re-exports colors from the unified color system
 * (seat-designer/colors.ts) to maintain a single source of truth for all
 * colors across both the seat designer and event inventory viewer.
 */

// Import all color constants from the unified system
export {
    // Canvas
    DEFAULT_CANVAS_BACKGROUND,
    LIGHT_CANVAS_BACKGROUND,
    DARK_CANVAS_BACKGROUND,
    // Shapes
    DEFAULT_SHAPE_FILL,
    DEFAULT_SHAPE_STROKE,
    // Seat Types
    STANDARD_SEAT_FILL,
    STANDARD_SEAT_STROKE,
    VIP_SEAT_FILL,
    VIP_SEAT_STROKE,
    HANDICAP_SEAT_FILL,
    HANDICAP_SEAT_STROKE,
    COUPLE_SEAT_FILL,
    COUPLE_SEAT_STROKE,
    WHEELCHAIR_SEAT_FILL,
    WHEELCHAIR_SEAT_STROKE,
    // Event Status Colors
    GRAY_FILL,
    GRAY_STROKE,
    BLUE_FILL,
    BLUE_STROKE,
    AMBER_FILL,
    AMBER_STROKE,
    PURPLE_FILL,
    PURPLE_STROKE,
    RED_FILL,
    RED_STROKE,
    GREEN_FILL,
    GREEN_STROKE,
    USED_FILL,
    USED_STROKE,
    // Hover States
    GRAY_HOVER_FILL,
    BLUE_HOVER_FILL,
    AMBER_HOVER_FILL,
    PURPLE_HOVER_FILL,
    RED_HOVER_FILL,
    GREEN_HOVER_FILL,
    GREEN_HOVER_STROKE,
    HOVER_FILL,
    HOVER_STROKE,
    // Interaction & Selection
    ANCHOR_FILL,
    ANCHOR_STROKE,
    SELECTED_FILL,
    SELECTED_STROKE,
    MARQUEE_STROKE,
    MARQUEE_FILL,
    // Labels
    LABEL_TEXT_FILL,
    LABEL_TEXT_COLOR,
    LABEL_BACKGROUND_FILL,
    LABEL_BACKGROUND_COLOR,
    LABEL_BACKGROUND_STROKE,
    LABEL_SHADOW_COLOR,
    // Utility functions
    getSeatTypeColors,
    getSeatStatusColor,
    getCanvasBackgroundColor,
} from "../seat-designer/colors";