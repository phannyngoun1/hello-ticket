/**
 * Point-in-shape hit detection for delegated event handling
 */

import { PlacementShapeType, type PlacementShape } from "./types";

/**
 * Check if a point (in percentage coordinates) is inside a shape.
 * Shape coordinates are in percentage; point is (px, py) in percentage.
 */
export function pointInShape(
  px: number,
  py: number,
  shape: PlacementShape,
  shapeX: number,
  shapeY: number,
  _imageWidth: number,
  _imageHeight: number
): boolean {
  const shapeType = shape.type;

  if (!shapeType) return false;

  switch (shapeType) {
    case PlacementShapeType.CIRCLE: {
      const radiusPercent = shape.radius ?? 1.2;
      const distSq = Math.pow(px - shapeX, 2) + Math.pow(py - shapeY, 2);
      return distSq <= Math.pow(radiusPercent, 2);
    }

    case PlacementShapeType.RECTANGLE:
    case PlacementShapeType.ELLIPSE:
    case PlacementShapeType.SEAT: {
      const halfW = (shape.width ?? 3) / 2;
      const halfH = (shape.height ?? 2) / 2;

      if (
        shapeType === PlacementShapeType.RECTANGLE ||
        shapeType === PlacementShapeType.SEAT
      ) {
        return (
          px >= shapeX - halfW &&
          px <= shapeX + halfW &&
          py >= shapeY - halfH &&
          py <= shapeY + halfH
        );
      }

      const a = halfW || 0.5;
      const b = halfH || 0.5;
      const dx = (px - shapeX) / a;
      const dy = (py - shapeY) / b;
      return dx * dx + dy * dy <= 1;
    }

    case PlacementShapeType.POLYGON:
    case PlacementShapeType.FREEFORM: {
      if (!shape.points || shape.points.length < 4) return false;
      const absPoints: number[] = [];
      for (let i = 0; i < shape.points.length; i += 2) {
        const pxVal = shape.points[i] ?? 0;
        const pyVal = shape.points[i + 1] ?? 0;
        const absX = shapeX + pxVal;
        const absY = shapeY + pyVal;
        absPoints.push(absX, absY);
      }
      return pointInPolygon(px, py, absPoints);
    }

    default:
      return false;
  }
}

function pointInPolygon(px: number, py: number, points: number[]): boolean {
  let inside = false;
  const n = points.length / 2;
  let j = n - 1;

  for (let i = 0; i < n; i++) {
    const xi = points[i * 2];
    const yi = points[i * 2 + 1];
    const xj = points[j * 2];
    const yj = points[j * 2 + 1];

    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
    j = i;
  }

  return inside;
}
