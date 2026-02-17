/**
 * Transformer for Section Marker
 * Handles resize, rotate, and cursor feedback for the rotation handle.
 */

import React, { useCallback } from "react";
import { Transformer } from "react-konva";
import Konva from "konva";
import { PlacementShapeType, type PlacementShape } from "../types";

const TRANSFORMER_STYLE = {
  borderStroke: "#3b82f6" as const,
  borderStrokeWidth: 1.5,
  anchorFill: "#ffffff" as const,
  anchorStroke: "#3b82f6" as const,
  anchorStrokeWidth: 1.5,
  anchorSize: 10,
  anchorCornerRadius: 2,
  padding: 0,
  minSize: 10,
};

const CORNER_ANCHORS: string[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

const ALL_ANCHORS: string[] = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

function isNearRotationHandle(
  stage: Konva.Stage,
  groupRef: React.RefObject<Konva.Group | null>,
): boolean {
  const group = groupRef.current;
  if (!group) return false;

  const stagePos = stage.getPointerPosition();
  if (!stagePos) return false;

  const layer = group.getLayer();
  if (!layer) return false;

  const layerScale = layer.scaleX();
  const nodeX = group.x();
  const nodeY = group.y();
  const nodeHeight = group.height();

  const rotationHandleOffset = 25 / layerScale;
  const rotationHandleY = nodeY - nodeHeight / 2 - rotationHandleOffset;
  const rotationHandleX = nodeX;
  const handleSize = 12 / layerScale;

  const distanceX = Math.abs(stagePos.x - rotationHandleX);
  const distanceY = Math.abs(stagePos.y - rotationHandleY);
  return (
    distanceX < handleSize && distanceY < handleSize + 15 / layerScale
  );
}

export interface SectionMarkerTransformerProps {
  transformerRef: React.RefObject<Konva.Transformer>;
  groupRef: React.RefObject<Konva.Group>;
  shape: PlacementShape;
  selectedShapeTool?: PlacementShapeType | null;
  onTransformProgress?: () => void;
}

export function SectionMarkerTransformer({
  transformerRef,
  groupRef,
  shape,
  selectedShapeTool,
  onTransformProgress,
}: SectionMarkerTransformerProps) {
  const keepRatio =
    shape.type === PlacementShapeType.CIRCLE ||
    shape.type === PlacementShapeType.SOFA ||
    shape.type === PlacementShapeType.STAGE;
  const enabledAnchors = keepRatio ? CORNER_ANCHORS : ALL_ANCHORS;

  const setDefaultCursor = useCallback(() => {
    return selectedShapeTool ? "crosshair" : "pointer";
  }, [selectedShapeTool]);

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      const stage = e.target.getStage();
      const container = stage?.container();
      if (!transformerRef.current || !stage || !container) return;

      if (isNearRotationHandle(stage, groupRef)) {
        container.style.cursor = "grabbing";
      }
    },
    [transformerRef, groupRef],
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      const stage = e.target.getStage();
      const container = stage?.container();
      if (!transformerRef.current || !stage || !container) return;

      if (isNearRotationHandle(stage, groupRef)) {
        container.style.cursor = "grab";
      } else {
        container.style.cursor = setDefaultCursor();
      }
    },
    [transformerRef, groupRef, setDefaultCursor],
  );

  const handleMouseLeaveOrUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      const container = e.target.getStage()?.container();
      if (container) {
        container.style.cursor = setDefaultCursor();
      }
    },
    [setDefaultCursor],
  );

  return (
    <Transformer
      ref={transformerRef}
      onTransform={onTransformProgress}
      onTransformStart={onTransformProgress}
      boundBoxFunc={(oldBox, newBox) => {
        if (
          Math.abs(newBox.width) < TRANSFORMER_STYLE.minSize ||
          Math.abs(newBox.height) < TRANSFORMER_STYLE.minSize
        ) {
          return oldBox;
        }
        return newBox;
      }}
      rotateEnabled={true}
      resizeEnabled={true}
      borderEnabled={true}
      borderStroke={TRANSFORMER_STYLE.borderStroke}
      borderStrokeWidth={TRANSFORMER_STYLE.borderStrokeWidth}
      anchorFill={TRANSFORMER_STYLE.anchorFill}
      anchorStroke={TRANSFORMER_STYLE.anchorStroke}
      anchorStrokeWidth={TRANSFORMER_STYLE.anchorStrokeWidth}
      anchorSize={TRANSFORMER_STYLE.anchorSize}
      anchorCornerRadius={TRANSFORMER_STYLE.anchorCornerRadius}
      padding={TRANSFORMER_STYLE.padding}
      ignoreStroke={true}
      keepRatio={keepRatio}
      flipEnabled={false}
      enabledAnchors={enabledAnchors}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseEnter={(e) => e.cancelBubble = true}
      onMouseLeave={handleMouseLeaveOrUp}
      onMouseUp={handleMouseLeaveOrUp}
    />
  );
}
