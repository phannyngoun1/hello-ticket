/**
 * Event Inventory Viewer – shared helpers and shape rendering
 */

import { Circle, Rect, Ellipse, Line } from "react-konva";
import type { EventSeatStatus } from "../types";
import {
  PlacementShapeType,
  type PlacementShape,
} from "../../seats/seat-designer/types";
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
  const baseProps = {
    fill: activeColors.fill || "transparent",
    stroke: activeColors.stroke || "transparent",
    strokeWidth,
    opacity,
  };

  if (!shape) {
    return <Circle {...baseProps} radius={12} />;
  }

  switch (shape.type) {
    case PlacementShapeType.CIRCLE: {
      const radius = shape.radius
        ? (shape.radius / 100) * Math.min(imageWidth, imageHeight)
        : 12;
      const validRadius = Math.max(1, Math.abs(radius));
      return (
        <Circle
          {...baseProps}
          radius={validRadius}
          rotation={shape.rotation || 0}
        />
      );
    }

    case PlacementShapeType.RECTANGLE: {
      const width = shape.width ? (shape.width / 100) * imageWidth : 24;
      const height = shape.height ? (shape.height / 100) * imageHeight : 24;
      const validWidth = Math.max(1, Math.abs(width));
      const validHeight = Math.max(1, Math.abs(height));
      const rawCornerRadius = shape.cornerRadius || 0;
      const maxCornerRadius = Math.min(validWidth, validHeight) / 2;
      const validCornerRadius = Math.max(
        0,
        Math.min(Math.abs(rawCornerRadius), maxCornerRadius),
      );
      return (
        <Rect
          {...baseProps}
          x={-validWidth / 2}
          y={-validHeight / 2}
          width={validWidth}
          height={validHeight}
          cornerRadius={validCornerRadius}
          rotation={shape.rotation || 0}
        />
      );
    }

    case PlacementShapeType.ELLIPSE: {
      const radiusX = shape.width ? ((shape.width / 100) * imageWidth) / 2 : 12;
      const radiusY = shape.height
        ? ((shape.height / 100) * imageHeight) / 2
        : 12;
      const validRadiusX = Math.max(1, Math.abs(radiusX));
      const validRadiusY = Math.max(1, Math.abs(radiusY));
      return (
        <Ellipse
          {...baseProps}
          radiusX={validRadiusX}
          radiusY={validRadiusY}
          rotation={shape.rotation || 0}
        />
      );
    }

    case PlacementShapeType.POLYGON: {
      if (!shape.points || shape.points.length < 6) {
        return <Circle {...baseProps} radius={12} />;
      }
      const points = shape.points.map((p, index) => {
        if (index % 2 === 0) {
          return (p / 100) * imageWidth;
        }
        return (p / 100) * imageHeight;
      });
      return <Line {...baseProps} points={points} closed={true} />;
    }

    case PlacementShapeType.FREEFORM: {
      if (!shape.points || shape.points.length < 4) {
        return <Circle {...baseProps} radius={12} />;
      }
      const points = shape.points.map((p, index) => {
        if (index % 2 === 0) {
          return (p / 100) * imageWidth;
        }
        return (p / 100) * imageHeight;
      });
      return <Line {...baseProps} points={points} closed={true} tension={0} />;
    }

    default:
      return <Circle {...baseProps} radius={12} />;
  }
}
