/**
 * Seat Designer – Color constants for shapes, canvas, and seat types
 * Centralized color management for easy adjustment
 */

/**
 * Canvas background colors
 */
export const DEFAULT_CANVAS_BACKGROUND = "#e5e7eb"; // gray-200
export const LIGHT_CANVAS_BACKGROUND = "#f3f4f6"; // gray-100
export const DARK_CANVAS_BACKGROUND = "#d1d5db"; // gray-300

/**
 * Shape default colors (when no custom colors set)
 */
export const DEFAULT_SHAPE_FILL = "#60a5fa"; // blue-400
export const DEFAULT_SHAPE_STROKE = "#2563eb"; // blue-600

/**
 * Seat type colors (based on SeatType enum)
 */
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

/**
 * Anchor/special marker colors
 */
export const ANCHOR_FILL = "#f97316"; // orange-500
export const ANCHOR_STROKE = "#ea580c"; // orange-600

/**
 * Selection and interaction states
 */
export const SELECTED_FILL = "#06b6d4"; // cyan-500
export const SELECTED_STROKE = "#0891b2"; // cyan-600

export const HOVER_FILL = "#60a5fa"; // blue-400
export const HOVER_STROKE = "#3b82f6"; // blue-500

/**
 * Selection marquee
 */
export const MARQUEE_STROKE = "#3b82f6"; // blue-500
export const MARQUEE_FILL = "rgba(59, 130, 246, 0.1)"; // blue with low opacity

/**
 * Label text and backgrounds
 */
export const LABEL_TEXT_COLOR = "#1e293b"; // slate-900
export const LABEL_BACKGROUND_COLOR = "rgba(255, 255, 255, 0.9)"; // white with slight transparency

/**
 * Utility function to get colors for seat type
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
 * Utility function to get canvas background color
 */
export function getCanvasBackgroundColor(
    variant: "default" | "light" | "dark" = "default"
): string {
    switch (variant) {
        case "light":
            return LIGHT_CANVAS_BACKGROUND;
        case "dark":
            return DARK_CANVAS_BACKGROUND;
        case "default":
        default:
            return DEFAULT_CANVAS_BACKGROUND;
    }
}
