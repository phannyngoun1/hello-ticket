/**
 * Event Inventory Viewer – shared helpers and shape rendering
 */

import type { EventSeatStatus } from "../../events/types";
import {
  PlacementShapeType,
  type PlacementShape,
} from "../seat-designer/types";
import { ShapeRenderer } from "../seat-designer/components/shape-renderer";
import {
  AMBER_FILL,
  AMBER_STROKE,
  BLUE_FILL,
  BLUE_STROKE,
  GRAY_FILL,
  GRAY_STROKE,
  GREEN_FILL,
  GREEN_STROKE,
  PURPLE_FILL,
  PURPLE_STROKE,
  RED_FILL,
  RED_STROKE,
  USED_FILL,
  USED_STROKE,
} from "./event-inventory-viewer-colors";

// Get color for ticket status (takes priority over event-seat status)
export function getTicketStatusColor(ticketStatus?: string): {
  fill: string;
  stroke: string;
} | null {
  if (!ticketStatus) return null;

  const statusUpper = String(ticketStatus).toUpperCase().trim();
  switch (statusUpper) {
    case "AVAILABLE":
      return { fill: GREEN_FILL, stroke: GREEN_STROKE };
    case "RESERVED":
      return { fill: AMBER_FILL, stroke: AMBER_STROKE };
    case "CONFIRMED":
      return { fill: BLUE_FILL, stroke: BLUE_STROKE };
    case "CANCELLED":
      return { fill: RED_FILL, stroke: RED_STROKE };
    case "USED":
      return { fill: USED_FILL, stroke: USED_STROKE };
    case "TRANSFERRED":
      return { fill: PURPLE_FILL, stroke: PURPLE_STROKE };
    default:
      return null;
  }
}

export function getSeatStatusColor(status: EventSeatStatus): {
  fill: string;
  stroke: string;
} {
  const statusUpper = String(status).toUpperCase().trim();

  switch (statusUpper) {
    case "AVAILABLE":
      return { fill: GREEN_FILL, stroke: GREEN_STROKE };
    case "RESERVED":
      return { fill: AMBER_FILL, stroke: AMBER_STROKE };
    case "SOLD":
      return { fill: BLUE_FILL, stroke: BLUE_STROKE };
    case "HELD":
      return { fill: PURPLE_FILL, stroke: PURPLE_STROKE };
    case "BLOCKED":
      return { fill: RED_FILL, stroke: RED_STROKE };
    default:
      return { fill: GRAY_FILL, stroke: GRAY_STROKE };
  }
}

/**
 * Get heat map fill color for section-level layout.
 * Light mode: dark blue (0% sold) -> grey (100% sold)
 * Dark mode: light blue (0% sold) -> light grey (100% sold) for visibility on dark canvas
 * @param soldRatio 0-1, where 0 = no seats sold, 1 = all seats sold
 * @param transparency 0-1, where 1 = fully opaque, 0 = fully transparent
 * @param isDarkMode when true, use lighter colors for dark canvas background
 */
export function getSectionHeatMapFill(
  soldRatio: number,
  transparency: number = 0.5,
  isDarkMode: boolean = false,
): string {
  const clampedRatio = Math.max(0, Math.min(1, soldRatio));
  const alpha = Math.max(0, Math.min(1, transparency));

  const start = isDarkMode
    ? { r: 59, g: 130, b: 246 } // blue-500
    : { r: 30, g: 58, b: 138 }; // dark blue #1e3a8a
  const end = isDarkMode
    ? { r: 156, g: 163, b: 175 } // gray-400
    : { r: 107, g: 114, b: 128 }; // gray-500

  const r = Math.round(start.r + (end.r - start.r) * clampedRatio);
  const g = Math.round(start.g + (end.g - start.g) * clampedRatio);
  const b = Math.round(start.b + (end.b - start.b) * clampedRatio);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getSeatStatusTransparency(status: EventSeatStatus): number {
  const statusUpper = String(status).toUpperCase().trim();

  switch (statusUpper) {
    case "AVAILABLE":
      return 1;
    case "SOLD":
      return 1;
    case "HELD":
      return 1;
    case "BLOCKED":
      return 0;
    case "RESERVED":
      return 1;
    default:
      return 1;
  }
}

export function parseShape(
  shapeString?: string | null,
): PlacementShape | undefined {
  if (!shapeString) return undefined;
  try {
    const parsed = JSON.parse(shapeString);
    if (parsed && typeof parsed === "object" && parsed.type) {
      const shape = {
        ...parsed,
        type: parsed.type as PlacementShapeType,
      };
      if (Object.values(PlacementShapeType).includes(shape.type)) {
        return shape;
      }
      console.warn("Invalid shape type:", shape.type);
      return undefined;
    }
  } catch (e) {
    console.error("Failed to parse shape:", e, "Shape string:", shapeString);
  }
  return undefined;
}

export interface ShapeColors {
  fill?: string;
  stroke?: string;
}

export function renderShape(
  shape: PlacementShape | undefined,
  colors: ShapeColors,
  imageWidth: number,
  imageHeight: number,
  strokeWidth: number = 2.5,
  opacity: number = 1,
  options?: { hoverColors?: ShapeColors; isHover?: boolean },
) {
  const activeColors =
    options?.isHover && options?.hoverColors ? options.hoverColors : colors;
  return (
    <ShapeRenderer
      shape={shape ?? undefined}
      fill={activeColors.fill || "transparent"}
      stroke={activeColors.stroke || "transparent"}
      strokeWidth={strokeWidth}
      imageWidth={imageWidth}
      imageHeight={imageHeight}
      opacity={opacity}
    />
  );
}
