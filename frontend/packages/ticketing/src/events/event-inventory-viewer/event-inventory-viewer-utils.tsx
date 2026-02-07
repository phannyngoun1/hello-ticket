/**
 * Event Inventory Viewer – shared helpers and shape rendering
 */

import { Circle, Rect, Ellipse, Line } from "react-konva";
import type { EventSeatStatus } from "../types";
import {
  PlacementShapeType,
  type PlacementShape,
} from "../../seats/seat-designer/types";

// Get color for ticket status (takes priority over event-seat status)
export function getTicketStatusColor(ticketStatus?: string): {
  fill: string;
  stroke: string;
} | null {
  if (!ticketStatus) return null;

  const statusUpper = String(ticketStatus).toUpperCase().trim();
  switch (statusUpper) {
    case "AVAILABLE":
      return { fill: "#10b981", stroke: "#059669" };
    case "RESERVED":
      return { fill: "#f59e0b", stroke: "#d97706" };
    case "CONFIRMED":
      return { fill: "#3b82f6", stroke: "#2563eb" };
    case "CANCELLED":
      return { fill: "#ef4444", stroke: "#dc2626" };
    case "USED":
      return { fill: "#6b7280", stroke: "#4b5563" };
    case "TRANSFERRED":
      return { fill: "#a855f7", stroke: "#9333ea" };
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
      return { fill: "#10b981", stroke: "#059669" };
    case "RESERVED":
      return { fill: "#f59e0b", stroke: "#d97706" };
    case "SOLD":
      return { fill: "#3b82f6", stroke: "#2563eb" };
    case "HELD":
      return { fill: "#a855f7", stroke: "#9333ea" };
    case "BLOCKED":
      return { fill: "#ef4444", stroke: "#dc2626" };
    default:
      return { fill: "#9ca3af", stroke: "#6b7280" };
  }
}

export function getSeatStatusTransparency(status: EventSeatStatus): number {
  const statusUpper = String(status).toUpperCase().trim();

  switch (statusUpper) {
    case "AVAILABLE":
      return 0.4;
    case "SOLD":
      return 0.7;
    case "HELD":
      return 0.6;
    case "BLOCKED":
      return 0.8;
    case "RESERVED":
      return 0.5;
    default:
      return 0.3;
  }
}

export function parseShape(
  shapeString?: string | null
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
  options?: { hoverColors?: ShapeColors; isHover?: boolean }
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
        Math.min(Math.abs(rawCornerRadius), maxCornerRadius)
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
