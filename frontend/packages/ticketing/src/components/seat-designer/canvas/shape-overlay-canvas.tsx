/**
 * Shape Overlay Component for Layout Canvas
 * Renders clickable overlay shapes with hover effects.
 */

import React, { useRef, useState, useEffect } from "react";
import { Group, Text } from "react-konva";
import Konva from "konva";
import type { PlacementShape } from "../types";
import type { PlacementShapeType } from "../types";
import { ShapeRenderer } from "../components/shape-renderer";

export interface ShapeOverlayCanvasProps {
  overlay: {
    id: string;
    x: number;
    y: number;
    shape: PlacementShape;
    onClick?: () => void;
    onHover?: () => void;
    label?: string;
    isSelected?: boolean;
    isPlacement?: boolean;
  };
  selection: { isSelected: boolean };
  handlers: { onShapeOverlayClick?: (overlayId: string) => void };
  canvas: {
    imageWidth: number;
    imageHeight: number;
    percentageToStage: (x: number, y: number) => { x: number; y: number };
  };
  interaction: {
    isPanning: boolean;
    isSpacePressed: boolean;
    selectedShapeTool?: PlacementShapeType | null;
    isPlacingSeats: boolean;
    isPlacingSections: boolean;
  };
  display?: { disableHoverAnimation?: boolean };
}

export function ShapeOverlayCanvas({
  overlay,
  selection: { isSelected },
  handlers: { onShapeOverlayClick },
  canvas: { imageWidth, imageHeight, percentageToStage },
  interaction: {
    isPanning,
    isSpacePressed,
    selectedShapeTool,
    isPlacingSeats,
    isPlacingSections,
  },
  display: { disableHoverAnimation = false } = {},
}: ShapeOverlayCanvasProps) {
  const [isHovered, setIsHovered] = useState(false);
  const shapeGroupRef = useRef<Konva.Group>(null);
  const labelRef = useRef<Konva.Text>(null);
  const { x, y } = percentageToStage(overlay.x, overlay.y);

  const baseOpacity = 0.25;
  const hoverOpacity = 0.3;
  const selectedOpacity = 0.55;

  let currentOpacity = baseOpacity;
  if (isSelected) currentOpacity = selectedOpacity;
  else if (isHovered) currentOpacity = hoverOpacity;

  let fillOpacity = 0.08;
  if (isSelected) fillOpacity = 0.15;

  let strokeColor = "#3b82f6";
  if (isSelected) strokeColor = "#1e40af";
  else if (isHovered) strokeColor = "#2563eb";

  let strokeWidth = 0.75;
  if (isSelected) strokeWidth = 2;
  else if (isHovered) strokeWidth = 1;

  const isActive = isHovered || isSelected;

  useEffect(() => {
    if (disableHoverAnimation) return;
    const shapeGroup = shapeGroupRef.current;
    if (!shapeGroup) return;

    shapeGroup.to({
      opacity: currentOpacity,
      duration: 0.2,
      easing: Konva.Easings.EaseInOut,
    });

    const children = shapeGroup.getChildren();
    children.forEach((child) => {
      if (child instanceof Konva.Shape) {
        child.to({
          strokeWidth,
          duration: 0.2,
          easing: Konva.Easings.EaseInOut,
        });
      }
    });
  }, [currentOpacity, strokeWidth, disableHoverAnimation]);

  useEffect(() => {
    if (disableHoverAnimation) return;
    const label = labelRef.current;
    if (!label) return;

    label.to({
      fontSize: isActive ? 13 : 12,
      shadowBlur: isActive ? 3 : 1,
      duration: 0.2,
      easing: Konva.Easings.EaseInOut,
    });
  }, [isActive, disableHoverAnimation]);

  return (
    <Group
      x={x}
      y={y}
      rotation={overlay.shape.rotation || 0}
      listening={true}
      onClick={(e) => {
        e.cancelBubble = true;
        onShapeOverlayClick?.(overlay.id);
        overlay.onClick?.();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onShapeOverlayClick?.(overlay.id);
        overlay.onClick?.();
      }}
      onMouseDown={(e) => {
        e.cancelBubble = true;
      }}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = selectedShapeTool ? "crosshair" : "pointer";
        }
        setIsHovered(true);
        overlay.onHover?.();
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          let cursor = "pointer";
          if (isPanning || isSpacePressed) cursor = "grab";
          else if (
            selectedShapeTool ||
            isPlacingSeats ||
            isPlacingSections
          )
            cursor = "crosshair";
          container.style.cursor = cursor;
        }
        setIsHovered(false);
      }}
    >
      <Group ref={shapeGroupRef}>
        <ShapeRenderer
          shape={overlay.shape}
          fill={`rgba(59, 130, 246, ${fillOpacity})`}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          opacity={1}
          dash={overlay.isPlacement ? [5, 5] : undefined}
        />
      </Group>
      {overlay.label && (
        <Text
          ref={labelRef}
          text={overlay.label}
          fontSize={12}
          fontFamily="Arial"
          fill={isActive ? "#1e40af" : "#3b82f6"}
          padding={4}
          align="center"
          verticalAlign="middle"
          backgroundFill={`rgba(255, 255, 255, ${isActive ? 0.98 : 0.9})`}
          backgroundStroke={strokeColor}
          backgroundStrokeWidth={isActive ? 0.75 : 0.5}
          cornerRadius={2}
          x={-20}
          y={-8}
          shadowBlur={isActive ? 3 : 1}
          shadowColor="rgba(0, 0, 0, 0.1)"
        />
      )}
    </Group>
  );
}

export const MemoizedShapeOverlayCanvas = React.memo(ShapeOverlayCanvas);
