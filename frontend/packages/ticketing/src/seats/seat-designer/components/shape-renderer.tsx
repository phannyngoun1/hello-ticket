/**
 * Shared ShapeRenderer Component
 *
 * Renders a PlacementShape (circle, rectangle, ellipse, polygon, freeform) as Konva elements.
 * Used by Seat Designer (layout-canvas) and Event Inventory Viewer.
 */

import React from "react";
import { Circle, Rect, Ellipse, Line } from "react-konva";
import {
  PlacementShapeType,
  type PlacementShape,
} from "../types";

export interface ShapeRendererProps {
  /** Shape to render. When undefined, renders default circle. */
  shape?: PlacementShape | null;
  fill: string;
  stroke: string;
  strokeWidth?: number;
  imageWidth: number;
  imageHeight: number;
  opacity?: number;
  dash?: number[];
  /** Rotation in degrees (applied to shapes that support it) */
  rotation?: number;
}

const DEFAULT_RADIUS = 12;

export function ShapeRenderer({
  shape,
  fill,
  stroke,
  strokeWidth = 2,
  imageWidth,
  imageHeight,
  opacity = 1,
  dash,
  rotation = 0,
}: ShapeRendererProps) {
  const baseProps = {
    fill,
    stroke,
    strokeWidth,
    opacity,
    dash,
    perfectDrawEnabled: false,
  };

  if (!shape || !shape.type) {
    return <Circle {...baseProps} radius={DEFAULT_RADIUS} />;
  }

  const shapeType = shape.type;
  if (!Object.values(PlacementShapeType).includes(shapeType as PlacementShapeType)) {
    return <Circle {...baseProps} radius={DEFAULT_RADIUS} />;
  }

  const rot = shape.rotation ?? rotation;

  switch (shapeType) {
    case PlacementShapeType.CIRCLE: {
      const radius = shape.radius
        ? (shape.radius / 100) * Math.min(imageWidth, imageHeight)
        : DEFAULT_RADIUS;
      const validRadius = Math.max(1, Math.abs(radius));
      return <Circle {...baseProps} radius={validRadius} rotation={rot} />;
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
          rotation={rot}
        />
      );
    }

    case PlacementShapeType.ELLIPSE: {
      const radiusX = shape.width ? ((shape.width / 100) * imageWidth) / 2 : DEFAULT_RADIUS;
      const radiusY = shape.height
        ? ((shape.height / 100) * imageHeight) / 2
        : DEFAULT_RADIUS;
      const validRadiusX = Math.max(1, Math.abs(radiusX));
      const validRadiusY = Math.max(1, Math.abs(radiusY));
      return (
        <Ellipse
          {...baseProps}
          radiusX={validRadiusX}
          radiusY={validRadiusY}
          rotation={rot}
        />
      );
    }

    case PlacementShapeType.POLYGON: {
      if (!shape.points || shape.points.length < 6) {
        return <Circle {...baseProps} radius={DEFAULT_RADIUS} />;
      }
      const points = shape.points.map((p, index) =>
        index % 2 === 0 ? (p / 100) * imageWidth : (p / 100) * imageHeight,
      );
      return <Line {...baseProps} points={points} closed={true} rotation={rot} />;
    }

    case PlacementShapeType.FREEFORM: {
      if (!shape.points || shape.points.length < 4) {
        return <Circle {...baseProps} radius={DEFAULT_RADIUS} />;
      }
      const points = shape.points.map((p, index) =>
        index % 2 === 0 ? (p / 100) * imageWidth : (p / 100) * imageHeight,
      );
      return (
        <Line {...baseProps} points={points} closed={true} tension={0} rotation={rot} />
      );
    }

    default:
      return <Circle {...baseProps} radius={DEFAULT_RADIUS} />;
  }
}
