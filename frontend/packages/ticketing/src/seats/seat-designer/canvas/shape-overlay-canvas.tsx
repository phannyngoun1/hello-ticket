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
  isSelected: boolean;
  onShapeOverlayClick?: (overlayId: string) => void;
  imageWidth: number;
  imageHeight: number;
  isPanning: boolean;
  isSpacePressed: boolean;
  selectedShapeTool?: PlacementShapeType | null;
  isPlacingSeats: boolean;
  isPlacingSections: boolean;
  percentageToStage: (x: number, y: number) => { x: number; y: number };
  disableHoverAnimation?: boolean;
}

export function ShapeOverlayCanvas({
  overlay,
  isSelected,
  onShapeOverlayClick,
  imageWidth,
  imageHeight,
  isPanning,
  isSpacePressed,
  selectedShapeTool,
  isPlacingSeats,
  isPlacingSections,
  percentageToStage,
  disableHoverAnimation = false,
}: ShapeOverlayCanvasProps) {
  const [isHovered, setIsHovered] = useState(false);
  const shapeGroupRef = useRef<Konva.Group>(null);
  const labelRef = useRef<Konva.Text>(null);
  const { x, y } = percentageToStage(overlay.x, overlay.y);

  const baseOpacity = 0.25;
  const hoverOpacity = 0.3;
  const selectedOpacity = 0.55;

  const currentOpacity = isSelected
    ? selectedOpacity
    : isHovered
      ? hoverOpacity
      : baseOpacity;

  const fillOpacity = isSelected ? 0.15 : isHovered ? 0.08 : 0.08;

  const strokeColor = isSelected
    ? "#1e40af"
    : isHovered
      ? "#2563eb"
      : "#3b82f6";

  const strokeWidth = isSelected ? 2 : isHovered ? 1 : 0.75;

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
      fontSize: isHovered || isSelected ? 13 : 12,
      shadowBlur: isHovered || isSelected ? 3 : 1,
      duration: 0.2,
      easing: Konva.Easings.EaseInOut,
    });
  }, [isHovered, isSelected, disableHoverAnimation]);

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
          container.style.cursor =
            isPanning || isSpacePressed
              ? "grab"
              : selectedShapeTool
                ? "crosshair"
                : isPlacingSeats || isPlacingSections
                  ? "crosshair"
                  : "default";
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
          fill={isHovered || isSelected ? "#1e40af" : "#3b82f6"}
          padding={4}
          align="center"
          verticalAlign="middle"
          backgroundFill={`rgba(255, 255, 255, ${isHovered || isSelected ? 0.98 : 0.9})`}
          backgroundStroke={strokeColor}
          backgroundStrokeWidth={isHovered || isSelected ? 0.75 : 0.5}
          cornerRadius={2}
          x={-20}
          y={-8}
          shadowBlur={isHovered || isSelected ? 3 : 1}
          shadowColor="rgba(0, 0, 0, 0.1)"
        />
      )}
    </Group>
  );
}

export const MemoizedShapeOverlayCanvas = React.memo(ShapeOverlayCanvas);
