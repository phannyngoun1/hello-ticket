/**
 * Unified Color System – Seat Designer & Event Inventory Viewer
 * Centralized color management for shapes, canvas, seat types, and event status
 */

// ============================================================================
// CANVAS & BACKGROUND COLORS
// ============================================================================

/** Canvas background colors */
export const DEFAULT_CANVAS_BACKGROUND = "#f7f9fd"; // light blue-gray
export const LIGHT_CANVAS_BACKGROUND = "#f3f4f6"; // gray-100
export const DARK_CANVAS_BACKGROUND = "#d1d5db"; // gray-300 (light mode variant)

/** Dark mode canvas background (when app theme is dark) */
export const DARK_MODE_CANVAS_BACKGROUND = "#1f2937"; // gray-800

// ============================================================================
// SHAPE DEFAULT COLORS (when no custom colors set)
// ============================================================================

export const DEFAULT_SHAPE_FILL = "#60a5fa"; // blue-400
export const DEFAULT_SHAPE_STROKE = "#2563eb"; // blue-600

// ============================================================================
// SEAT TYPE COLORS (Designer: represents seat types during design)
// ============================================================================

export const STANDARD_SEAT_FILL = "#3b82f6"; // blue-500
export const STANDARD_SEAT_STROKE = "#1d4ed8"; // blue-700

export const VIP_SEAT_FILL = "#f59e0b"; // amber-500
export const VIP_SEAT_STROKE = "#d97706"; // amber-600

export const HANDICAP_SEAT_FILL = "#8b5cf6"; // violet-500
export const HANDICAP_SEAT_STROKE = "#7c3aed"; // violet-600

export const COUPLE_SEAT_FILL = "#ec4899"; // pink-500
export const COUPLE_SEAT_STROKE = "#db2777"; // pink-600

export const WHEELCHAIR_SEAT_FILL = "#06b6d4"; // cyan-500
export const WHEELCHAIR_SEAT_STROKE = "#0891b2"; // cyan-600

// ============================================================================
// EVENT SEAT STATUS COLORS (Viewer: represents booking status at runtime)
// ============================================================================

/** Default / no seats / gray */
export const GRAY_FILL = "#6b7280";
export const GRAY_STROKE = "#374151";

/** Sold / confirmed */
export const BLUE_FILL = "#0ea5e9";
export const BLUE_STROKE = "#0284c7";

/** Reserved */
export const AMBER_FILL = "#f59e0b";
export const AMBER_STROKE = "#b45309";

/** Held / transferred */
export const PURPLE_FILL = "#d946ef";
export const PURPLE_STROKE = "#a21caf";

/** Blocked / cancelled */
export const RED_FILL = "#ef4444";
export const RED_STROKE = "#991b1b";

/** Available */
export const GREEN_FILL = "#10b981";
export const GREEN_STROKE = "#047857";

/** Ticket status: used */
export const USED_FILL = "#6b7280";
export const USED_STROKE = "#4b5563";

// ============================================================================
// HOVER STATES (Brighter variants for interactive feedback)
// ============================================================================

export const GRAY_HOVER_FILL = "#9ca3af";
export const BLUE_HOVER_FILL = "#06b6d4";
export const AMBER_HOVER_FILL = "#fcd34d";
export const PURPLE_HOVER_FILL = "#e879f9";
export const RED_HOVER_FILL = "#fca5a5";
export const GREEN_HOVER_FILL = "#6ee7b7";
export const GREEN_HOVER_STROKE = "#10b981";

/** Default hover state */
export const HOVER_FILL = "#60a5fa"; // blue-400
export const HOVER_STROKE = "#3b82f6"; // blue-500

// ============================================================================
// INTERACTION & SELECTION COLORS
// ============================================================================

/** Selected seat (cyan) */
export const SELECTED_FILL = "#06b6d4"; // cyan-500
export const SELECTED_STROKE = "#0891b2"; // cyan-600

/** Selection marquee */
export const MARQUEE_STROKE = "#3b82f6"; // blue-500
export const MARQUEE_FILL = "rgba(59, 130, 246, 0.1)"; // blue with low opacity

// ============================================================================
// LABEL & TEXT STYLING
// ============================================================================

/** Section name label (light mode) */
export const LABEL_TEXT_COLOR = "#1e293b"; // slate-900
export const LABEL_TEXT_FILL = "#1e293b"; // alias for viewer consistency
export const LABEL_BACKGROUND_COLOR = "rgba(255, 255, 255, 0.9)"; // white with slight transparency
export const LABEL_BACKGROUND_FILL = "rgba(255, 255, 255, 0.9)"; // alias for viewer consistency
export const LABEL_BACKGROUND_STROKE = "#e2e8f0"; // light gray border
export const LABEL_SHADOW_COLOR = "rgba(0,0,0,0.2)"; // soft shadow

/** Section name label (dark mode) */
export const LABEL_TEXT_FILL_DARK = "#f1f5f9"; // slate-100
export const LABEL_BACKGROUND_FILL_DARK = "rgba(31, 41, 55, 0.95)"; // gray-800 with transparency
export const LABEL_BACKGROUND_STROKE_DARK = "#4b5563"; // gray-600
export const LABEL_SHADOW_COLOR_DARK = "rgba(0,0,0,0.4)"; // stronger shadow for dark bg

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get colors for a specific seat type (Designer usage)
 * @param seatType The seat type (standard, vip, handicap, couple, wheelchair)
 * @returns Object with fill and stroke colors
 */
export function getSeatTypeColors(
    seatType?: string
): { fill: string; stroke: string } {
    const type = seatType?.toLowerCase() || "standard";

    switch (type) {
        case "vip":
            return { fill: VIP_SEAT_FILL, stroke: VIP_SEAT_STROKE };
        case "handicap":
            return { fill: HANDICAP_SEAT_FILL, stroke: HANDICAP_SEAT_STROKE };
        case "couple":
            return { fill: COUPLE_SEAT_FILL, stroke: COUPLE_SEAT_STROKE };
        case "wheelchair":
            return { fill: WHEELCHAIR_SEAT_FILL, stroke: WHEELCHAIR_SEAT_STROKE };
        case "standard":
        default:
            return {
                fill: STANDARD_SEAT_FILL,
                stroke: STANDARD_SEAT_STROKE,
            };
    }
}

/**
 * Get colors for event seat status (Viewer usage)
 * @param status The event seat status (available, sold, reserved, held, blocked)
 * @returns Object with fill and stroke colors
 */
export function getSeatStatusColor(
    status?: string
): { fill: string; stroke: string } {
    const st = status?.toLowerCase() || "available";

    switch (st) {
        case "sold":
        case "confirmed":
            return { fill: BLUE_FILL, stroke: BLUE_STROKE };
        case "reserved":
            return { fill: AMBER_FILL, stroke: AMBER_STROKE };
        case "held":
        case "transferred":
            return { fill: PURPLE_FILL, stroke: PURPLE_STROKE };
        case "blocked":
        case "cancelled":
            return { fill: RED_FILL, stroke: RED_STROKE };
        case "available":
        default:
            return { fill: GREEN_FILL, stroke: GREEN_STROKE };
    }
}

/**
 * Get marker colors for a seat (Designer usage)
 * Uses shape fill/stroke when set; falls back to type-based default
 */
export function getSeatMarkerColors(seat: {
  seat: { seatType: string };
  shape?: { fillColor?: string; strokeColor?: string };
}): { fill: string; stroke: string } {
  const defaults = getSeatTypeColors(seat.seat.seatType);
  const fill = seat.shape?.fillColor?.trim();
  const stroke = seat.shape?.strokeColor?.trim();
  return {
    fill: fill || defaults.fill,
    stroke: stroke || defaults.stroke,
  };
}

/**
 * Get marker colors for a section (Designer usage)
 * Uses shape fill/stroke when set; falls back to default
 */
export function getSectionMarkerColors(section: {
  shape?: { fillColor?: string; strokeColor?: string };
}): { fill: string; stroke: string } {
  const defaultFill = "#60a5fa";
  const defaultStroke = "#2563eb";
  const fill = section.shape?.fillColor?.trim();
  const stroke = section.shape?.strokeColor?.trim();
  return {
    fill: fill || defaultFill,
    stroke: stroke || defaultStroke,
  };
}

/**
 * Get canvas background color variant
 * @param variant The background variant (default, light, dark)
 * @returns Hex color string
 */
export function getCanvasBackgroundColor(variant?: string): string {
    switch (variant?.toLowerCase()) {
        case "light":
            return LIGHT_CANVAS_BACKGROUND;
        case "dark":
            return DARK_CANVAS_BACKGROUND;
        case "default":
        default:
            return DEFAULT_CANVAS_BACKGROUND;
    }
}
