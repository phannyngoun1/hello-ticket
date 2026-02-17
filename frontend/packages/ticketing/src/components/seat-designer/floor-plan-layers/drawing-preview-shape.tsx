/**
 * Preview shape while drawing (for non-freeform shape types)
 */

import React from "react";
import { Group } from "react-konva";
import Konva from "konva";
import {
  PlacementShapeType,
  type PlacementShape,
} from "../types";
import { ShapeRenderer } from "../components/shape-renderer";

const PREVIEW_SHAPE_STYLE = {
  fill: "rgba(59, 130, 246, 0.15)" as const,
  stroke: "#3b82f6" as const,
  strokeWidth: 1.5,
  opacity: 0.8,
};

function getPreviewShapeForType(
  type: PlacementShapeType,
  w: number,
  h: number,
): PlacementShape {
  const shapeByType: Record<PlacementShapeType, () => PlacementShape> = {
    [PlacementShapeType.CIRCLE]: () => ({
      type: PlacementShapeType.CIRCLE,
      radius: Math.max(0.8, Math.max(w, h) / 2),
    }),
    [PlacementShapeType.RECTANGLE]: () => ({
      type: PlacementShapeType.RECTANGLE,
      width: Math.max(1, w),
      height: Math.max(1, h),
      cornerRadius: 2,
    }),
    [PlacementShapeType.ELLIPSE]: () => ({
      type: PlacementShapeType.ELLIPSE,
      width: Math.max(1, w),
      height: Math.max(1, h),
    }),
    [PlacementShapeType.POLYGON]: () => {
      const base = [-1, -1, 1, -1, 1.5, 0, 1, 1, -1, 1, -1.5, 0];
      const pts = base.map((p, i) =>
        i % 2 === 0 ? p * (w / 2) : p * (h / 2),
      );
      return { type: PlacementShapeType.POLYGON, points: pts };
    },
    [PlacementShapeType.FREEFORM]: () => ({
      type: PlacementShapeType.POLYGON,
      points: [-1, -1, 1, -1, 1.5, 0, 1, 1, -1, 1, -1.5, 0],
    }),
    [PlacementShapeType.SOFA]: () => {
      // Sofa: lock aspect ratio width:height = 10:20 (1:2)
      const SOFA_RATIO_W = 10;
      const SOFA_RATIO_H = 20;
      const size = Math.max(4, Math.max(w, h));
      const sofaWidth = (size * SOFA_RATIO_W) / SOFA_RATIO_H;
      const sofaHeight = size;
      const minW = (4 * SOFA_RATIO_W) / SOFA_RATIO_H;
      return {
        type: PlacementShapeType.SOFA,
        width: Math.max(minW, sofaWidth),
        height: Math.max(4, sofaHeight),
        fillColor: "#60a5fa",
        strokeColor: "#2563eb",
      };
    },
    [PlacementShapeType.STAGE]: () => ({
      type: PlacementShapeType.STAGE,
      width: Math.max(20, w),
      height: Math.max(15, h),
      fillColor: "#333333",
      strokeColor: "#2563eb",
    }),
    [PlacementShapeType.SEAT]: () => ({
      type: PlacementShapeType.SEAT,
      width: Math.max(1, w),
      height: Math.max(1, h),
    }),
  };
  return shapeByType[type]?.() ?? shapeByType[PlacementShapeType.POLYGON]();
}

export interface DrawingPreviewShapeProps {
  drawStartPos: { x: number; y: number };
  drawCurrentPos: { x: number; y: number };
  selectedShapeTool: PlacementShapeType;
  percentageToStage: (x: number, y: number) => { x: number; y: number };
  displayedWidth: number;
  displayedHeight: number;
  previewShapeRef: React.RefObject<Konva.Group>;
}

export function DrawingPreviewShape({
  drawStartPos,
  drawCurrentPos,
  selectedShapeTool,
  percentageToStage,
  displayedWidth,
  displayedHeight,
  previewShapeRef,
}: DrawingPreviewShapeProps) {
  const { x: startX, y: startY } = drawStartPos;
  const { x: endX, y: endY } = drawCurrentPos;
  const minSize = 1.5;
  const w = Math.max(minSize, Math.abs(endX - startX));
  const h = Math.max(minSize, Math.abs(endY - startY));
  const cx = (startX + endX) / 2;
  const cy = (startY + endY) / 2;
  const { x, y } = percentageToStage(cx, cy);
  const previewShape = getPreviewShapeForType(selectedShapeTool, w, h);

  return (
    <Group ref={previewShapeRef} x={x} y={y}>
      <ShapeRenderer
        shape={previewShape}
        fill={PREVIEW_SHAPE_STYLE.fill}
        stroke={PREVIEW_SHAPE_STYLE.stroke}
        strokeWidth={PREVIEW_SHAPE_STYLE.strokeWidth}
        imageWidth={displayedWidth}
        imageHeight={displayedHeight}
        opacity={PREVIEW_SHAPE_STYLE.opacity}
      />
    </Group>
  );
}
