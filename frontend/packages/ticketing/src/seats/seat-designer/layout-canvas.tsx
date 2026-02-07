/**
 * Konva-based Canvas Component for Seat Designer
 *
 * Provides better performance and smoother interactions compared to DOM-based rendering
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
  Stage,
  Layer,
  Image,
  Circle,
  Group,
  Text,
  Rect,
  Ellipse,
  Line,
  Transformer,
} from "react-konva";
import Konva from "konva";
import { SeatType } from "../types";
import {
  PlacementShapeType,
  type PlacementShape,
  type SeatMarker,
  type SectionMarker,
} from "./types";

// Types are now imported from ./types

/**
 * Renders a placement shape based on shape configuration
 */
interface ShapeRendererProps {
  shape: PlacementShape;
  fill: string;
  stroke: string;
  strokeWidth: number;
  imageWidth: number;
  imageHeight: number;
  opacity?: number;
  dash?: number[];
}

function ShapeRenderer({
  shape,
  fill,
  stroke,
  strokeWidth,
  imageWidth,
  imageHeight,
  opacity = 1,
  dash,
}: ShapeRendererProps) {
  const baseProps = {
    fill,
    stroke,
    strokeWidth,
    opacity,
    dash,
    perfectDrawEnabled: false,
  };

  // Normalize shape type to ensure it matches enum values
  // When parsed from JSON, type is a string, so we need to ensure it matches the enum
  const shapeType = shape.type;

  // Debug logging to help identify issues
  if (
    !shapeType ||
    !Object.values(PlacementShapeType).includes(shapeType as PlacementShapeType)
  ) {
    console.warn(
      "Invalid shape type:",
      shapeType,
      "Shape:",
      shape,
      "Valid types:",
      Object.values(PlacementShapeType)
    );
    // Fallback to circle if type is invalid
    return <Circle {...baseProps} radius={12} />;
  }

  switch (shapeType) {
    case PlacementShapeType.CIRCLE: {
      const radius = shape.radius
        ? (shape.radius / 100) * Math.min(imageWidth, imageHeight)
        : 12; // Default radius
      // Ensure radius is positive and non-zero
      const validRadius = Math.max(1, Math.abs(radius));
      return <Circle {...baseProps} radius={validRadius} />;
    }

    case PlacementShapeType.RECTANGLE: {
      const width = shape.width ? (shape.width / 100) * imageWidth : 24; // Default width
      const height = shape.height ? (shape.height / 100) * imageHeight : 24; // Default height
      // Ensure width and height are positive and non-zero
      const validWidth = Math.max(1, Math.abs(width));
      const validHeight = Math.max(1, Math.abs(height));
      // Ensure cornerRadius doesn't exceed half the smallest dimension
      // This prevents negative radius in arc calculations
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
        />
      );
    }

    case PlacementShapeType.ELLIPSE: {
      const radiusX = shape.width ? ((shape.width / 100) * imageWidth) / 2 : 12; // Default radiusX
      const radiusY = shape.height
        ? ((shape.height / 100) * imageHeight) / 2
        : 12; // Default radiusY
      // Ensure radiusX and radiusY are positive and non-zero
      const validRadiusX = Math.max(1, Math.abs(radiusX));
      const validRadiusY = Math.max(1, Math.abs(radiusY));
      return (
        <Ellipse {...baseProps} radiusX={validRadiusX} radiusY={validRadiusY} />
      );
    }

    case PlacementShapeType.POLYGON: {
      if (!shape.points || shape.points.length < 6) {
        // Fallback to circle if polygon points are invalid
        const radius = 12;
        return <Circle {...baseProps} radius={radius} />;
      }
      // Convert percentage points to absolute coordinates
      const points = shape.points.map((p, index) => {
        if (index % 2 === 0) {
          // x coordinate
          return (p / 100) * imageWidth;
        } else {
          // y coordinate
          return (p / 100) * imageHeight;
        }
      });
      return <Line {...baseProps} points={points} closed={true} />;
    }

    case PlacementShapeType.FREEFORM: {
      if (!shape.points || shape.points.length < 4) {
        // Need at least 2 points (x, y, x, y)
        const radius = 12;
        return <Circle {...baseProps} radius={radius} />;
      }
      // Convert percentage points to absolute coordinates
      // Freeform points are relative to center (0, 0)
      const points = shape.points.map((p, index) => {
        if (index % 2 === 0) {
          // x coordinate
          return (p / 100) * imageWidth;
        } else {
          // y coordinate
          return (p / 100) * imageHeight;
        }
      });
      // Use straight lines (no tension) for polygon drawing
      return <Line {...baseProps} points={points} closed={true} tension={0} />;
    }

    default:
      // Default to circle
      return <Circle {...baseProps} radius={12} />;
  }
}

interface LayoutCanvasProps {
  imageUrl: string;
  seats: SeatMarker[];
  sections?: SectionMarker[];
  selectedSeatId?: string | null;
  selectedSectionId?: string | null;
  /** Multi-selection: all selected seat ids (used for highlight + Delete). */
  selectedSeatIds?: string[];
  /** Multi-selection: all selected section ids (used for highlight + Delete). */
  selectedSectionIds?: string[];
  /** Called when user finishes a drag-to-select marquee with markers inside the rect. */
  onMarkersInRect?: (seatIds: string[], sectionIds: string[]) => void;
  isPlacingSeats: boolean;
  isPlacingSections: boolean;
  readOnly?: boolean;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  onSeatClick?: (seat: SeatMarker, event?: { shiftKey?: boolean }) => void;
  onSectionClick?: (
    section: SectionMarker,
    event?: { shiftKey?: boolean }
  ) => void;
  onSectionDoubleClick?: (section: SectionMarker) => void;
  onSectionDragEnd?: (sectionId: string, newX: number, newY: number) => void;
  onSeatDragEnd: (seatId: string, newX: number, newY: number) => void;
  onSeatShapeTransform?: (seatId: string, shape: PlacementShape) => void;
  onSectionShapeTransform?: (sectionId: string, shape: PlacementShape) => void;
  onImageClick?: (
    e: Konva.KonvaEventObject<MouseEvent>,
    percentageCoords?: { x: number; y: number }
  ) => void;
  onDeselect?: () => void;
  onShapeDraw?: (
    shape: PlacementShape,
    x: number,
    y: number,
    width?: number,
    height?: number
  ) => void;
  onShapeOverlayClick?: (overlayId: string) => void;
  onWheel?: (
    e: Konva.KonvaEventObject<WheelEvent>,
    isSpacePressed: boolean
  ) => void;
  onPanStart?: () => void;
  onPan?: (delta: { x: number; y: number }) => void;
  onPanEnd?: () => void;
  containerWidth: number;
  containerHeight: number;
  venueType: "small" | "large";
  selectedShapeTool?: PlacementShapeType | null;
  shapeOverlays?: Array<{
    id: string;
    x: number;
    y: number;
    shape: PlacementShape;
    onClick?: () => void;
    onHover?: () => void;
    label?: string;
    isSelected?: boolean;
    isPlacement?: boolean;
  }>;
  selectedOverlayId?: string | null;
}

// Shape Overlay Component with hover effects
interface ShapeOverlayComponentProps {
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

// Threshold: only virtualize when we have more than this many objects
const VIRTUALIZATION_THRESHOLD = 40;

// Threshold: disable hover animations when total count exceeds this
const HOVER_ANIMATION_THRESHOLD = 100;

function ShapeOverlayComponent({
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
}: ShapeOverlayComponentProps) {
  const [isHovered, setIsHovered] = useState(false);
  const shapeGroupRef = useRef<Konva.Group>(null);
  const labelRef = useRef<Konva.Text>(null);
  const { x, y } = percentageToStage(overlay.x, overlay.y);

  // Calculate opacity and stroke based on state
  // More transparent by default, brighter on hover/selection
  const baseOpacity = 0.25; // More transparent default
  const hoverOpacity = 0.45; // Slightly more visible on hover
  const selectedOpacity = 0.55; // Most visible when selected

  const currentOpacity = isSelected
    ? selectedOpacity
    : isHovered
      ? hoverOpacity
      : baseOpacity;

  const fillOpacity = isSelected ? 0.15 : isHovered ? 0.12 : 0.08; // Very transparent fill

  const strokeColor = isSelected
    ? "#1e40af"
    : isHovered
      ? "#2563eb"
      : "#3b82f6";

  const strokeWidth = isSelected ? 3 : isHovered ? 2.5 : 2;

  // Animate opacity on hover/selection change (skip when disabled for performance)
  useEffect(() => {
    if (disableHoverAnimation) return;
    const shapeGroup = shapeGroupRef.current;
    if (!shapeGroup) return;

    const targetOpacity = currentOpacity;
    shapeGroup.to({
      opacity: targetOpacity,
      duration: 0.2,
      easing: Konva.Easings.EaseInOut,
    });

    // Animate stroke width on children shapes
    const children = shapeGroup.getChildren();
    children.forEach((child) => {
      if (child instanceof Konva.Shape) {
        child.to({
          strokeWidth: strokeWidth,
          duration: 0.2,
          easing: Konva.Easings.EaseInOut,
          // Removed dashed style animation - passed as prop instead
        });
      }
    });
  }, [currentOpacity, strokeWidth, disableHoverAnimation]);

  // Animate label on hover/selection
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
          container.style.cursor = "pointer";
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
          opacity={1} // Let the Group handle opacity animation
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
          backgroundStrokeWidth={isHovered || isSelected ? 1.5 : 1}
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

const MemoizedShapeOverlayComponent = React.memo(ShapeOverlayComponent);

// Seat marker component with hover transitions
interface SeatMarkerComponentProps {
  seat: SeatMarker;
  x: number;
  y: number;
  isSelected: boolean;
  isPlacingSeats: boolean;
  isPanning: boolean;
  isSpacePressed: boolean;
  isPlacingSections: boolean;
  selectedShapeTool?: PlacementShapeType | null;
  onSeatClick?: (seat: SeatMarker, event?: { shiftKey?: boolean }) => void;
  onSeatDragEnd: (seatId: string, e: Konva.KonvaEventObject<DragEvent>) => void;
  onShapeTransform?: (seatId: string, shape: PlacementShape) => void;
  colors: { fill: string; stroke: string };
  imageWidth: number;
  imageHeight: number;
  readOnly?: boolean;
  disableHoverAnimation?: boolean;
  onSeatDragStart?: (seatId: string) => void;
  useLowDetail?: boolean;
}

function SeatMarkerComponent({
  seat,
  x,
  y,
  isSelected,
  isPlacingSeats,
  isPanning,
  isSpacePressed,
  isPlacingSections,
  selectedShapeTool,
  onSeatClick,
  onSeatDragEnd,
  onShapeTransform,
  colors,
  imageWidth,
  imageHeight,
  readOnly = false,
  disableHoverAnimation = false,
  onSeatDragStart,
  useLowDetail = false,
}: SeatMarkerComponentProps) {
  const shapeRef = useRef<Konva.Shape>(null);
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Default shape if none specified
  const defaultShape: PlacementShape = {
    type: PlacementShapeType.CIRCLE,
    radius: 1.2, // ~12px at 1000px image width
  };
  const shape = seat.shape || defaultShape;

  // Create a key that changes when shape dimensions change
  const shapeKey = useMemo(() => {
    return JSON.stringify({
      type: shape.type,
      width: shape.width,
      height: shape.height,
      radius: shape.radius,
      points: shape.points,
      rotation: shape.rotation,
    });
  }, [
    shape.type,
    shape.width,
    shape.height,
    shape.radius,
    shape.points,
    shape.rotation,
  ]);

  // Attach transformer when selected and update when shape changes
  useEffect(() => {
    if (
      !readOnly &&
      isSelected &&
      groupRef.current &&
      transformerRef.current
    ) {
      transformerRef.current.nodes([groupRef.current]);
      // Force all anchors to be visible
      transformerRef.current.forceUpdate();
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, shapeKey, readOnly]);

  // Cache shape for performance when not selected
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    if (isSelected) {
      group.clearCache();
    } else if (!useLowDetail) {
      group.cache();
    }
  }, [isSelected, useLowDetail, shapeKey]);

  // Calculate bounding box for transformer (if needed in the future)
  // const getBoundingBox = () => {
  //   if (shape.type === PlacementShapeType.CIRCLE) {
  //     const radius = shape.radius ? (shape.radius / 100) * Math.min(imageWidth, imageHeight) : 12;
  //     return { width: radius * 2, height: radius * 2 };
  //   } else if (shape.type === PlacementShapeType.RECTANGLE || shape.type === PlacementShapeType.ELLIPSE) {
  //     const width = shape.width ? (shape.width / 100) * imageWidth : 30;
  //     const height = shape.height ? (shape.height / 100) * imageHeight : 20;
  //     return { width, height };
  //   } else {
  //     // Polygon - estimate bounding box
  //     return { width: 30, height: 30 };
  //   }
  // };

  // Animate border color on hover state change
  useEffect(() => {
    if (disableHoverAnimation) return;
    const shapeNode = shapeRef.current;
    if (!shapeNode || isSelected) return;

    const hoverStrokeColor = isHovered ? colors.stroke : colors.stroke;

    shapeNode.to({
      stroke: hoverStrokeColor,
      strokeWidth: isHovered ? 2.5 : 2, // More visible border
      duration: 0.2,
      easing: Konva.Easings.EaseInOut,
    });
  }, [isHovered, isSelected, colors.stroke, disableHoverAnimation]);

  // Make markers more visible with better colors
  // Use seat type colors but make them more vibrant and visible
  const fillColor = isSelected ? colors.fill : colors.fill;
  const strokeColor = isSelected ? colors.stroke : colors.stroke;
  const strokeWidth = isSelected ? 2.5 : 2; // More visible border
  const fillOpacity = isSelected ? 0.5 : 0.35; // More visible opacity

  // Handle transform end - convert back to percentage coordinates
  const handleTransformEnd = useCallback(() => {
    if (!groupRef.current || !onShapeTransform) return;

    const node = groupRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    // Reset scale and apply to dimensions
    node.scaleX(1);
    node.scaleY(1);

    const updatedShape: PlacementShape = { ...shape };

    if (shape.type === PlacementShapeType.CIRCLE) {
      const currentRadius = shape.radius
        ? (shape.radius / 100) * Math.min(imageWidth, imageHeight)
        : 12;
      const newRadius =
        currentRadius * Math.max(Math.abs(scaleX), Math.abs(scaleY));
      // Ensure minimum radius (0.1% of image)
      const minRadiusPercent = 0.1;
      updatedShape.radius = Math.max(
        minRadiusPercent,
        (newRadius / Math.min(imageWidth, imageHeight)) * 100
      );
    } else if (
      shape.type === PlacementShapeType.RECTANGLE ||
      shape.type === PlacementShapeType.ELLIPSE
    ) {
      const currentWidth = shape.width ? (shape.width / 100) * imageWidth : 30;
      const currentHeight = shape.height
        ? (shape.height / 100) * imageHeight
        : 20;
      // Ensure minimum dimensions (0.1% of image)
      const minWidthPercent = 0.1;
      const minHeightPercent = 0.1;
      updatedShape.width = Math.max(
        minWidthPercent,
        (Math.abs(currentWidth * scaleX) / imageWidth) * 100
      );
      updatedShape.height = Math.max(
        minHeightPercent,
        (Math.abs(currentHeight * scaleY) / imageHeight) * 100
      );
      // For rectangles, ensure cornerRadius doesn't exceed dimensions
      if (
        shape.type === PlacementShapeType.RECTANGLE &&
        updatedShape.cornerRadius
      ) {
        const maxCornerRadius =
          Math.min(
            (updatedShape.width / 100) * imageWidth,
            (updatedShape.height / 100) * imageHeight
          ) / 2;
        updatedShape.cornerRadius = Math.min(
          updatedShape.cornerRadius,
          (maxCornerRadius / imageWidth) * 100
        );
      }
    } else if (shape.type === PlacementShapeType.FREEFORM && shape.points) {
      // Scale all points proportionally
      const avgScale = Math.abs((scaleX + scaleY) / 2);
      updatedShape.points = shape.points.map((p) => p * avgScale);
    } else if (shape.type === PlacementShapeType.POLYGON && shape.points) {
      // Scale polygon points proportionally
      const avgScale = Math.abs((scaleX + scaleY) / 2);
      updatedShape.points = shape.points.map((p) => p * avgScale);
    }

    updatedShape.rotation = rotation;
    onShapeTransform(seat.id, updatedShape);

    // Force transformer to update after shape change
    // Use setTimeout to ensure the update happens after React re-renders with new shape
    setTimeout(() => {
      if (transformerRef.current && groupRef.current) {
        transformerRef.current.nodes([groupRef.current]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }, 0);
  }, [shape, imageWidth, imageHeight, onShapeTransform, seat.id]);

  return (
    <>
      <Group
        ref={groupRef}
        name="seat-marker"
        x={x}
        y={y}
        rotation={shape.rotation || 0}
        draggable={!readOnly && isPlacingSeats && isSelected}
        onDragStart={!readOnly && onSeatDragStart ? () => onSeatDragStart(seat.id) : undefined}
        onDragEnd={!readOnly ? (e) => onSeatDragEnd(seat.id, e) : undefined}
        onTransformEnd={!readOnly ? handleTransformEnd : undefined}
        onMouseDown={(e) => {
          // Allow clicks to pass through to Layer when polygon tool is selected
          if (selectedShapeTool === PlacementShapeType.FREEFORM) {
            return; // Don't cancel bubble, let it pass through
          }
          e.cancelBubble = true;
        }}
        onClick={(e) => {
          // Allow clicks to pass through to Layer when polygon tool is selected
          if (selectedShapeTool === PlacementShapeType.FREEFORM) {
            return; // Don't cancel bubble, let it pass through
          }
          e.cancelBubble = true;
          onSeatClick?.(seat, { shiftKey: e.evt.shiftKey });
        }}
        onTap={(e) => {
          // Allow clicks to pass through to Layer when polygon tool is selected
          if (selectedShapeTool === PlacementShapeType.FREEFORM) {
            return; // Don't cancel bubble, let it pass through
          }
          e.cancelBubble = true;
          onSeatClick?.(seat, { shiftKey: e.evt.shiftKey });
        }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = isSelected ? "move" : "pointer";
          }
          setIsHovered(true);
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor =
              isPanning || isSpacePressed
                ? "grab"
                : isPlacingSeats || isPlacingSections
                  ? "crosshair"
                  : "pointer"; // Pointer tool shows pointer cursor
          }
          setIsHovered(false);
        }}
      >
        <Group ref={shapeRef as any}>
          {useLowDetail ? (
            <Circle
              radius={3}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={1}
              opacity={fillOpacity}
              perfectDrawEnabled={false}
            />
          ) : (
            <ShapeRenderer
              shape={shape}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              opacity={fillOpacity}
            />
          )}
        </Group>
      </Group>
      {isSelected && !readOnly && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            const minSize = 10;
            if (
              Math.abs(newBox.width) < minSize ||
              Math.abs(newBox.height) < minSize
            ) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={true}
          resizeEnabled={true}
          borderEnabled={true}
          borderStroke="#3b82f6"
          borderStrokeWidth={2}
          anchorFill="#ffffff"
          anchorStroke="#3b82f6"
          anchorStrokeWidth={2}
          anchorSize={10}
          anchorCornerRadius={2}
          ignoreStroke={false}
          keepRatio={false}
          flipEnabled={false}
          enabledAnchors={[
            "top-left",
            "top-center",
            "top-right",
            "middle-left",
            "middle-right",
            "bottom-left",
            "bottom-center",
            "bottom-right",
          ]}
          onMouseDown={(e) => {
            // Prevent shape drawing when interacting with transformer
            e.cancelBubble = true;
          }}
          onMouseMove={(e) => {
            // Prevent shape drawing when interacting with transformer
            e.cancelBubble = true;

            // Handle cursor change for rotation handle
            const target = e.target;
            const stage = target.getStage();
            const container = stage?.container();
            if (!transformerRef.current || !stage || !container) return;

            const stagePos = stage.getPointerPosition();
            if (!stagePos) return;

            const transformer = transformerRef.current;
            const layer = transformer.getLayer();
            if (!layer || !groupRef.current) return;

            const layerScale = layer.scaleX();
            // Get the attached node's position and size
            const node = groupRef.current;
            const nodeX = node.x();
            const nodeY = node.y();
            const nodeHeight = node.height();

            // The rotation handle is positioned above the top-center anchor
            // Typically 20-30px above the top edge, centered horizontally
            const rotationHandleOffset = 25 / layerScale; // 25px above top, adjusted for zoom
            const rotationHandleY =
              nodeY - nodeHeight / 2 - rotationHandleOffset;
            const rotationHandleX = nodeX; // Center horizontally
            const handleSize = 12 / layerScale; // Approximate size, adjusted for zoom

            // Check if mouse is near the rotation handle
            const distanceX = Math.abs(stagePos.x - rotationHandleX);
            const distanceY = Math.abs(stagePos.y - rotationHandleY);
            const isNearRotationHandle =
              distanceX < handleSize &&
              distanceY < handleSize + 15 / layerScale;

            if (isNearRotationHandle) {
              container.style.cursor = "grab";
            } else {
              // Let transformer handle its own cursors for resize handles
              container.style.cursor = "";
            }
          }}
          onMouseEnter={(e) => {
            // Prevent shape drawing when interacting with transformer
            e.cancelBubble = true;
          }}
          onMouseLeave={(e) => {
            // Reset cursor when leaving transformer
            const target = e.target;
            const stage = target.getStage();
            const container = stage?.container();
            if (container) {
              container.style.cursor = "";
            }
          }}
          onMouseUp={(e) => {
            // Prevent shape drawing when interacting with transformer
            e.cancelBubble = true;

            // Reset cursor after mouse up
            const target = e.target;
            const stage = target.getStage();
            const container = stage?.container();
            if (container) {
              container.style.cursor = "";
            }
          }}
        />
      )}
    </>
  );
}

const MemoizedSeatMarkerComponent = React.memo(SeatMarkerComponent);

// Section marker component with hover transitions
interface SectionMarkerComponentProps {
  section: SectionMarker;
  x: number;
  y: number;
  isSelected: boolean;
  isPlacingSections: boolean;
  isPanning: boolean;
  isSpacePressed: boolean;
  isPlacingSeats: boolean;
  selectedShapeTool?: PlacementShapeType | null;
  onSectionClick?: (
    section: SectionMarker,
    event?: { shiftKey?: boolean }
  ) => void;
  onSectionDoubleClick?: (section: SectionMarker) => void;
  onSectionDragEnd?: (sectionId: string, newX: number, newY: number) => void;
  onShapeTransform?: (sectionId: string, shape: PlacementShape) => void;
  imageWidth: number;
  readOnly?: boolean;
  imageHeight: number;
  disableHoverAnimation?: boolean;
  onSectionDragStart?: (sectionId: string) => void;
  useLowDetail?: boolean;
  colors: { fill: string; stroke: string };
}

function SectionMarkerComponent({
  section,
  x,
  y,
  isSelected,
  isPlacingSections,
  isPanning,
  isSpacePressed,
  isPlacingSeats,
  selectedShapeTool,
  onSectionClick,
  onSectionDoubleClick,
  onSectionDragEnd,
  onShapeTransform,
  imageWidth,
  imageHeight,
  readOnly = false,
  disableHoverAnimation = false,
  onSectionDragStart,
  useLowDetail = false,
  colors,
}: SectionMarkerComponentProps) {
  const groupRef = useRef<Konva.Group>(null);
  const shapeRef = useRef<Konva.Shape>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Default shape if none specified (rectangle for sections)
  const defaultShape: PlacementShape = {
    type: PlacementShapeType.RECTANGLE,
    width: 3, // ~30px at 1000px image width
    height: 2, // ~20px at 1000px image height
  };
  const shape = section.shape || defaultShape;

  // Create a key that changes when shape dimensions change
  const shapeKey = useMemo(() => {
    if (!section.shape) return null;
    return JSON.stringify({
      type: shape.type,
      width: shape.width,
      height: shape.height,
      radius: shape.radius,
      points: shape.points,
      rotation: shape.rotation,
    });
  }, [
    section.shape,
    shape.type,
    shape.width,
    shape.height,
    shape.radius,
    shape.points,
    shape.rotation,
  ]);

  // Attach transformer when selected and shape exists, update when shape changes
  useEffect(() => {
    if (
      !readOnly &&
      isSelected &&
      section.shape &&
      groupRef.current &&
      transformerRef.current
    ) {
      transformerRef.current.nodes([groupRef.current]);
      // Force all anchors to be visible
      transformerRef.current.forceUpdate();
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, shapeKey, readOnly]);

  // Cache shape for performance when not selected
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    if (isSelected) {
      group.clearCache();
    } else if (!useLowDetail && section.shape) {
      group.cache();
    }
  }, [isSelected, useLowDetail, section.shape, shapeKey]);

  // Handle transform end - convert back to percentage coordinates
  const handleTransformEnd = useCallback(() => {
    if (!groupRef.current || !onShapeTransform || !section.shape) return;

    const node = groupRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    // Reset scale and apply to dimensions
    node.scaleX(1);
    node.scaleY(1);

    const updatedShape: PlacementShape = { ...shape };

    if (shape.type === PlacementShapeType.CIRCLE) {
      const currentRadius = shape.radius
        ? (shape.radius / 100) * Math.min(imageWidth, imageHeight)
        : 12;
      const newRadius =
        currentRadius * Math.max(Math.abs(scaleX), Math.abs(scaleY));
      // Ensure minimum radius (0.1% of image)
      const minRadiusPercent = 0.1;
      updatedShape.radius = Math.max(
        minRadiusPercent,
        (newRadius / Math.min(imageWidth, imageHeight)) * 100
      );
    } else if (
      shape.type === PlacementShapeType.RECTANGLE ||
      shape.type === PlacementShapeType.ELLIPSE
    ) {
      const currentWidth = shape.width ? (shape.width / 100) * imageWidth : 30;
      const currentHeight = shape.height
        ? (shape.height / 100) * imageHeight
        : 20;
      // Ensure minimum dimensions (0.1% of image)
      const minWidthPercent = 0.1;
      const minHeightPercent = 0.1;
      updatedShape.width = Math.max(
        minWidthPercent,
        (Math.abs(currentWidth * scaleX) / imageWidth) * 100
      );
      updatedShape.height = Math.max(
        minHeightPercent,
        (Math.abs(currentHeight * scaleY) / imageHeight) * 100
      );
      // For rectangles, ensure cornerRadius doesn't exceed dimensions
      if (
        shape.type === PlacementShapeType.RECTANGLE &&
        updatedShape.cornerRadius
      ) {
        const maxCornerRadius =
          Math.min(
            (updatedShape.width / 100) * imageWidth,
            (updatedShape.height / 100) * imageHeight
          ) / 2;
        updatedShape.cornerRadius = Math.min(
          updatedShape.cornerRadius,
          (maxCornerRadius / imageWidth) * 100
        );
      }
    } else if (shape.type === PlacementShapeType.FREEFORM && shape.points) {
      // Scale all points proportionally
      const avgScale = Math.abs((scaleX + scaleY) / 2);
      updatedShape.points = shape.points.map((p) => p * avgScale);
    } else if (shape.type === PlacementShapeType.POLYGON && shape.points) {
      // Scale polygon points proportionally
      const avgScale = Math.abs((scaleX + scaleY) / 2);
      updatedShape.points = shape.points.map((p) => p * avgScale);
    }

    updatedShape.rotation = rotation;
    onShapeTransform(section.id, updatedShape);

    // Force transformer to update after shape change
    // Use setTimeout to ensure the update happens after React re-renders with new shape
    setTimeout(() => {
      if (transformerRef.current && groupRef.current) {
        transformerRef.current.nodes([groupRef.current]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }, 0);
  }, [
    shape,
    imageWidth,
    imageHeight,
    onShapeTransform,
    section.id,
    section.shape,
  ]);

  // Animate shape border on hover state change (when placing sections)
  useEffect(() => {
    if (disableHoverAnimation) return;
    const shapeNode = shapeRef.current;
    if (!shapeNode || !isPlacingSections || isSelected) return;

    const hoverStrokeWidth = isHovered ? 2.5 : 2;
    shapeNode.to({
      stroke: colors.stroke,
      strokeWidth: hoverStrokeWidth,
      duration: 0.2,
      easing: Konva.Easings.EaseInOut,
    });
  }, [isHovered, isSelected, isPlacingSections, disableHoverAnimation, colors.stroke]);

  return (
    <>
      <Group
        ref={groupRef}
        x={x}
        y={y}
        rotation={shape.rotation || 0}
        draggable={!readOnly && isPlacingSections && isSelected}
        onDragStart={!readOnly && onSectionDragStart ? () => onSectionDragStart(section.id) : undefined}
        onDragEnd={!readOnly ? (e) => {
          if (!onSectionDragEnd) return;
          const node = e.target;
          // node.x() and node.y() are already in stage coordinates
          onSectionDragEnd(section.id, node.x(), node.y());
        } : undefined}
        onTransformEnd={!readOnly && section.shape ? handleTransformEnd : undefined}
        onMouseDown={(e) => {
          // Allow clicks to pass through to Layer when polygon tool is selected
          if (selectedShapeTool === PlacementShapeType.FREEFORM) {
            return; // Don't cancel bubble, let it pass through
          }
          e.cancelBubble = true;
        }}
        onClick={(e) => {
          // Allow clicks to pass through to Layer when polygon tool is selected
          if (selectedShapeTool === PlacementShapeType.FREEFORM) {
            return; // Don't cancel bubble, let it pass through
          }
          e.cancelBubble = true;
          const shiftKey = e.evt.shiftKey || false;
          onSectionClick?.(section, { shiftKey });
        }}
        onDblClick={(e) => {
          // Allow clicks to pass through to Layer when polygon tool is selected
          if (selectedShapeTool === PlacementShapeType.FREEFORM) {
            return; // Don't cancel bubble, let it pass through
          }
          e.cancelBubble = true;
          onSectionDoubleClick?.(section);
        }}
        onTap={(e: any) => {
          // Allow clicks to pass through to Layer when polygon tool is selected
          if (selectedShapeTool === PlacementShapeType.FREEFORM) {
            return; // Don't cancel bubble, let it pass through
          }
          e.cancelBubble = true;
          const shiftKey = e.evt?.shiftKey || false;
          onSectionClick?.(section, { shiftKey });
        }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor =
              isSelected && section.shape ? "move" : "pointer";
          }
          setIsHovered(true);
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor =
              isPanning || isSpacePressed
                ? "grab"
                : isPlacingSeats || isPlacingSections
                  ? "crosshair"
                  : "pointer"; // Pointer tool shows pointer cursor
          }
          setIsHovered(false);
        }}
      >
        {/* Shape marker for section (if shape is defined) */}
        {section.shape && (
          <Group ref={shapeRef as any}>
            {useLowDetail ? (
              <Circle
                radius={4}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={1}
                opacity={isSelected ? 0.5 : 0.35}
                perfectDrawEnabled={false}
              />
            ) : (
              <ShapeRenderer
                shape={shape}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={isSelected ? 2.5 : 2}
                imageWidth={imageWidth}
                imageHeight={imageHeight}
                opacity={isSelected ? 0.5 : 0.35}
              />
            )}
          </Group>
        )}
        {/* Default circle marker when no shape is defined */}
        {!section.shape && (
          <Circle
            radius={isSelected ? 12 : 10}
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth={isSelected ? 2.5 : 2}
            x={0}
            y={0}
            opacity={isSelected ? 0.5 : 0.35}
          />
        )}
      </Group>
      {isSelected && !readOnly && section.shape && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            const minSize = 10;
            if (
              Math.abs(newBox.width) < minSize ||
              Math.abs(newBox.height) < minSize
            ) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={true}
          resizeEnabled={true}
          borderEnabled={true}
          borderStroke="#3b82f6"
          borderStrokeWidth={2}
          anchorFill="#ffffff"
          anchorStroke="#3b82f6"
          anchorStrokeWidth={2}
          anchorSize={10}
          anchorCornerRadius={2}
          ignoreStroke={false}
          keepRatio={false}
          flipEnabled={false}
          enabledAnchors={[
            "top-left",
            "top-center",
            "top-right",
            "middle-left",
            "middle-right",
            "bottom-left",
            "bottom-center",
            "bottom-right",
          ]}
          onMouseDown={(e) => {
            // Prevent shape drawing when interacting with transformer
            e.cancelBubble = true;

            // Set grabbing cursor when clicking on rotation handle
            const target = e.target;
            const stage = target.getStage();
            const container = stage?.container();
            if (!transformerRef.current || !stage || !container) return;

            const stagePos = stage.getPointerPosition();
            if (!stagePos) return;

            const transformer = transformerRef.current;
            const layer = transformer.getLayer();
            if (!layer || !groupRef.current) return;

            const layerScale = layer.scaleX();
            // Get the attached node's position and size
            const node = groupRef.current;
            const nodeX = node.x();
            const nodeY = node.y();
            const nodeHeight = node.height();

            const rotationHandleOffset = 25 / layerScale;
            const rotationHandleY =
              nodeY - nodeHeight / 2 - rotationHandleOffset;
            const rotationHandleX = nodeX;
            const handleSize = 12 / layerScale;

            const distanceX = Math.abs(stagePos.x - rotationHandleX);
            const distanceY = Math.abs(stagePos.y - rotationHandleY);
            const isNearRotationHandle =
              distanceX < handleSize &&
              distanceY < handleSize + 15 / layerScale;

            if (isNearRotationHandle) {
              container.style.cursor = "grabbing";
            }
          }}
          onMouseMove={(e) => {
            // Prevent shape drawing when interacting with transformer
            e.cancelBubble = true;

            // Handle cursor change for rotation handle
            const target = e.target;
            const stage = target.getStage();
            const container = stage?.container();
            if (!transformerRef.current || !stage || !container) return;

            const stagePos = stage.getPointerPosition();
            if (!stagePos) return;

            const transformer = transformerRef.current;
            const layer = transformer.getLayer();
            if (!layer || !groupRef.current) return;

            const layerScale = layer.scaleX();
            // Get the attached node's position and size
            const node = groupRef.current;
            const nodeX = node.x();
            const nodeY = node.y();
            const nodeHeight = node.height();

            // The rotation handle is positioned above the top-center anchor
            // Typically 20-30px above the top edge, centered horizontally
            const rotationHandleOffset = 25 / layerScale; // 25px above top, adjusted for zoom
            const rotationHandleY =
              nodeY - nodeHeight / 2 - rotationHandleOffset;
            const rotationHandleX = nodeX; // Center horizontally
            const handleSize = 12 / layerScale; // Approximate size, adjusted for zoom

            // Check if mouse is near the rotation handle
            const distanceX = Math.abs(stagePos.x - rotationHandleX);
            const distanceY = Math.abs(stagePos.y - rotationHandleY);
            const isNearRotationHandle =
              distanceX < handleSize &&
              distanceY < handleSize + 15 / layerScale;

            if (isNearRotationHandle) {
              container.style.cursor = "grab";
            } else {
              // Let transformer handle its own cursors for resize handles
              container.style.cursor = "";
            }
          }}
          onMouseEnter={(e) => {
            // Prevent shape drawing when interacting with transformer
            e.cancelBubble = true;
          }}
          onMouseLeave={(e) => {
            // Reset cursor when leaving transformer
            const target = e.target;
            const stage = target.getStage();
            const container = stage?.container();
            if (container) {
              container.style.cursor = "";
            }
          }}
          onMouseUp={(e) => {
            // Prevent shape drawing when interacting with transformer
            e.cancelBubble = true;

            // Reset cursor after mouse up
            const target = e.target;
            const stage = target.getStage();
            const container = stage?.container();
            if (container) {
              container.style.cursor = "";
            }
          }}
        />
      )}
    </>
  );
}

const MemoizedSectionMarkerComponent = React.memo(SectionMarkerComponent);

export function LayoutCanvas({
  imageUrl,
  seats,
  sections = [],
  selectedSeatId,
  selectedSectionId,
  selectedSeatIds: selectedSeatIdsProp,
  selectedSectionIds: selectedSectionIdsProp,
  onMarkersInRect,
  isPlacingSeats,
  isPlacingSections,
  readOnly = false,
  zoomLevel,
  panOffset,
  onSeatClick,
  onSectionClick,
  onSectionDoubleClick,
  onSectionDragEnd,
  onSeatDragEnd,
  onSeatShapeTransform,
  onSectionShapeTransform,
  onImageClick,
  onDeselect,
  onShapeDraw,
  onShapeOverlayClick,
  onWheel,
  onPanStart,
  onPan,
  onPanEnd,
  containerWidth,
  containerHeight,
  venueType,
  selectedShapeTool,
  shapeOverlays = [],
  selectedOverlayId,
}: LayoutCanvasProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [drawStartPos, setDrawStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [drawCurrentPos, setDrawCurrentPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [freeformPath, setFreeformPath] = useState<
    Array<{ x: number; y: number }>
  >([]);
  const [freeformHoverPos, setFreeformHoverPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const previewShapeRef = useRef<Konva.Group>(null);

  // Drag layer optimization: track which item is being dragged
  const [draggedSeatId, setDraggedSeatId] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);

  // Drag-to-select marquee (stage coordinates)
  const [selectionStart, setSelectionStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Multi-selection sets (derived from props or single selection)
  const selectedSeatIdSet = useMemo(() => {
    if (selectedSeatIdsProp && selectedSeatIdsProp.length > 0) {
      return new Set(selectedSeatIdsProp);
    }
    return new Set(selectedSeatId ? [selectedSeatId] : []);
  }, [selectedSeatIdsProp, selectedSeatId]);
  const selectedSectionIdSet = useMemo(() => {
    if (selectedSectionIdsProp && selectedSectionIdsProp.length > 0) {
      return new Set(selectedSectionIdsProp);
    }
    return new Set(selectedSectionId ? [selectedSectionId] : []);
  }, [selectedSectionIdsProp, selectedSectionId]);

  // Ref to prevent click event after drag-to-draw
  const ignoreClickRef = useRef(false);

  // Handle Space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't prevent default if user is typing in an input field
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest("input, textarea, [contenteditable]");

      // Handle Delete/Backspace to delete last freeform point
      if ((e.key === "Delete" || e.key === "Backspace") && !isInputField) {
        if (
          selectedShapeTool === PlacementShapeType.FREEFORM &&
          freeformPath.length > 0
        ) {
          e.preventDefault();
          setFreeformPath((prev) => {
            const newPath = prev.slice(0, -1); // Remove last point
            if (newPath.length === 0) {
              setFreeformHoverPos(null);
            }
            return newPath;
          });
        }
        return;
      }

      if (e.code === "Space" && !e.repeat && !isInputField) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Don't prevent default if user is typing in an input field
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest("input, textarea, [contenteditable]");

      if (e.code === "Space" && !isInputField) {
        e.preventDefault();
        setIsSpacePressed(false);
        if (isPanning) {
          setIsPanning(false);
          onPanEnd?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPanning, onPanEnd, selectedShapeTool, freeformPath]);

  // Load image
  useEffect(() => {
    if (!imageUrl) {
      setImage(null);
      setImageLoading(false);
      return;
    }

    // Check if we already have this image loaded
    if (image && (image.src === imageUrl || image.src.endsWith(imageUrl))) {
      setImageLoading(false);
      return;
    }

    setImageLoading(true);
    const img = new window.Image();
    img.crossOrigin = "anonymous";

    const handleLoad = () => {
      setImage(img);
      setImageLoading(false);
    };

    const handleError = () => {
      console.error("Failed to load image:", imageUrl);
      setImage(null);
      setImageLoading(false);
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  // Get seat color based on type - more vibrant colors for visibility
  const getSeatColor = (seatType: SeatType) => {
    switch (seatType) {
      case SeatType.VIP:
        return { fill: "#fbbf24", stroke: "#d97706" }; // vibrant yellow/gold
      case SeatType.WHEELCHAIR:
        return { fill: "#34d399", stroke: "#059669" }; // vibrant green
      default:
        return { fill: "#60a5fa", stroke: "#2563eb" }; // vibrant blue (instead of gray)
    }
  };

  // Use shape fill/stroke when both set, otherwise type-based seat color
  const getSeatMarkerColors = (seat: SeatMarker) => {
    const fill = seat.shape?.fillColor?.trim();
    const stroke = seat.shape?.strokeColor?.trim();
    if (fill && stroke) return { fill, stroke };
    return getSeatColor(seat.seat.seatType);
  };

  // Use shape fill/stroke when both set, otherwise default section blue
  const getSectionMarkerColors = (section: SectionMarker) => {
    const fill = section.shape?.fillColor?.trim();
    const stroke = section.shape?.strokeColor?.trim();
    if (fill && stroke) return { fill, stroke };
    return { fill: "#60a5fa", stroke: "#2563eb" };
  };

  // Convert percentage coordinates to Konva stage coordinates
  // Since Layer has offsetX/offsetY set to center, coordinates are relative to Layer's centered origin
  const percentageToStage = useCallback(
    (xPercent: number, yPercent: number) => {
      if (!image) return { x: 0, y: 0 };

      const validWidth = containerWidth > 0 ? containerWidth : 800;
      const validHeight = containerHeight > 0 ? containerHeight : 600;

      const imageAspectRatio = image.height / image.width;
      const containerAspectRatio = validHeight / validWidth;

      let displayedWidth: number;
      let displayedHeight: number;

      if (imageAspectRatio > containerAspectRatio) {
        displayedHeight = validHeight;
        displayedWidth = displayedHeight / imageAspectRatio;
      } else {
        displayedWidth = validWidth;
        displayedHeight = displayedWidth * imageAspectRatio;
      }

      // Image is positioned centered in container
      const imageX = (validWidth - displayedWidth) / 2;
      const imageY = (validHeight - displayedHeight) / 2;

      const x = imageX + (xPercent / 100) * displayedWidth;
      const y = imageY + (yPercent / 100) * displayedHeight;

      return { x, y };
    },
    [image, containerWidth, containerHeight]
  );

  // Convert Konva stage coordinates to percentage
  // Coordinates are relative to Layer's centered origin
  const stageToPercentage = useCallback(
    (stageX: number, stageY: number) => {
      if (!image) return { x: 0, y: 0 };

      const validWidth = containerWidth > 0 ? containerWidth : 800;
      const validHeight = containerHeight > 0 ? containerHeight : 600;

      const imageAspectRatio = image.height / image.width;
      const containerAspectRatio = validHeight / validWidth;

      let displayedWidth: number;
      let displayedHeight: number;

      if (imageAspectRatio > containerAspectRatio) {
        displayedHeight = validHeight;
        displayedWidth = displayedHeight / imageAspectRatio;
      } else {
        displayedWidth = validWidth;
        displayedHeight = displayedWidth * imageAspectRatio;
      }

      // Image is positioned centered in container
      const imageX = (validWidth - displayedWidth) / 2;
      const imageY = (validHeight - displayedHeight) / 2;

      const x = ((stageX - imageX) / displayedWidth) * 100;
      const y = ((stageY - imageY) / displayedHeight) * 100;

      return { x, y };
    },
    [image, containerWidth, containerHeight]
  );

  // Convert stage pointer position to percentage, accounting for Layer transforms
  const pointerToPercentage = useCallback(
    (pointerX: number, pointerY: number) => {
      if (!image) return { x: 0, y: 0 };

      // Account for Layer transforms: panOffset, zoomLevel, and offset (centering)
      const validWidth = containerWidth > 0 ? containerWidth : 800;
      const validHeight = containerHeight > 0 ? containerHeight : 600;
      const centerX = validWidth / 2;
      const centerY = validHeight / 2;

      // Reverse the Layer transform:
      // Layer has: x = centerX + panOffset.x, y = centerY + panOffset.y, offsetX = centerX, offsetY = centerY
      // So to reverse: first subtract the layer position, then reverse zoom, then add back offset
      const relativeToLayerX = pointerX - (centerX + panOffset.x);
      const relativeToLayerY = pointerY - (centerY + panOffset.y);

      // Reverse zoom (divide by zoomLevel)
      const beforeZoomX = relativeToLayerX / zoomLevel;
      const beforeZoomY = relativeToLayerY / zoomLevel;

      // Add back offset to get stage coordinates
      const stageX = beforeZoomX + centerX;
      const stageY = beforeZoomY + centerY;

      // Now convert to percentage relative to image
      const imageAspectRatio = image.height / image.width;
      const containerAspectRatio = validHeight / validWidth;

      let displayedWidth: number;
      let displayedHeight: number;

      if (imageAspectRatio > containerAspectRatio) {
        displayedHeight = validHeight;
        displayedWidth = displayedHeight / imageAspectRatio;
      } else {
        displayedWidth = validWidth;
        displayedHeight = displayedWidth * imageAspectRatio;
      }

      const imageX = (validWidth - displayedWidth) / 2;
      const imageY = (validHeight - displayedHeight) / 2;

      const x = ((stageX - imageX) / displayedWidth) * 100;
      const y = ((stageY - imageY) / displayedHeight) * 100;

      return { x, y };
    },
    [image, containerWidth, containerHeight, panOffset, zoomLevel]
  );

  // Handle seat drag end
  const handleSeatDragEnd = useCallback(
    (seatId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const { x, y } = stageToPercentage(node.x(), node.y());
      setDraggedSeatId(null);
      onSeatDragEnd(seatId, x, y);
    },
    [onSeatDragEnd, stageToPercentage]
  );

  const handleSeatDragStart = useCallback((seatId: string) => {
    setDraggedSeatId(seatId);
  }, []);

  const handleSectionDragEnd = useCallback(
    (sectionId: string, stageX: number, stageY: number) => {
      setDraggedSectionId(null);
      const { x, y } = stageToPercentage(stageX, stageY);
      onSectionDragEnd?.(sectionId, x, y);
    },
    [onSectionDragEnd, stageToPercentage]
  );

  const handleSectionDragStart = useCallback((sectionId: string) => {
    setDraggedSectionId(sectionId);
  }, []);

  // Ensure container dimensions are valid
  const validWidth = containerWidth > 0 ? containerWidth : 800;
  const validHeight = containerHeight > 0 ? containerHeight : 600;

  // Compute display dimensions (use defaults when image not ready - for consistent hook order)
  const centerX = validWidth / 2;
  const centerY = validHeight / 2;
  const imageAspectRatio =
    image && image.width && image.height ? image.height / image.width : 1;
  const containerAspectRatio = validHeight / validWidth;
  const displayedWidth =
    imageAspectRatio > containerAspectRatio
      ? validHeight / imageAspectRatio
      : validWidth;
  const displayedHeight =
    imageAspectRatio > containerAspectRatio
      ? validHeight
      : validWidth * imageAspectRatio;
  const imageX = (validWidth - displayedWidth) / 2;
  const imageY = (validHeight - displayedHeight) / 2;

  // Viewport virtualization - MUST be before any early return to keep hook order consistent
  const { visibleSeats, visibleSections, visibleShapeOverlays } = useMemo(() => {
    const totalCount = seats.length + sections.length + shapeOverlays.length;
    if (totalCount < VIRTUALIZATION_THRESHOLD) {
      return {
        visibleSeats: seats,
        visibleSections: sections,
        visibleShapeOverlays: shapeOverlays,
      };
    }

    const padding = 0.2;
    const minLayerX =
      centerX -
      (centerX + panOffset.x) / zoomLevel -
      (validWidth * padding) / zoomLevel;
    const maxLayerX =
      centerX +
      (validWidth - centerX - panOffset.x) / zoomLevel +
      (validWidth * padding) / zoomLevel;
    const minLayerY =
      centerY -
      (centerY + panOffset.y) / zoomLevel -
      (validHeight * padding) / zoomLevel;
    const maxLayerY =
      centerY +
      (validHeight - centerY - panOffset.y) / zoomLevel +
      (validHeight * padding) / zoomLevel;

    const isInView = (px: number, py: number) => {
      const layerX = imageX + (px / 100) * displayedWidth;
      const layerY = imageY + (py / 100) * displayedHeight;
      return (
        layerX >= minLayerX &&
        layerX <= maxLayerX &&
        layerY >= minLayerY &&
        layerY <= maxLayerY
      );
    };

    const visibleSeats = seats.filter((s) => {
      if (selectedSeatIdSet.has(s.id)) return true;
      return isInView(s.x, s.y);
    });
    const visibleSections = sections.filter((s) => {
      if (selectedSectionIdSet.has(s.id)) return true;
      return isInView(s.x, s.y);
    });
    const visibleShapeOverlays = shapeOverlays.filter((o) => {
      if (selectedOverlayId === o.id) return true;
      return isInView(o.x, o.y);
    });

    return {
      visibleSeats,
      visibleSections,
      visibleShapeOverlays,
    };
  }, [
    seats,
    sections,
    shapeOverlays,
    panOffset,
    zoomLevel,
    validWidth,
    validHeight,
    centerX,
    centerY,
    imageX,
    imageY,
    displayedWidth,
    displayedHeight,
    selectedSeatIdSet,
    selectedSectionIdSet,
    selectedOverlayId,
  ]);

  const totalVisibleCount =
    visibleSeats.length + visibleSections.length + visibleShapeOverlays.length;
  const disableHoverAnimation = totalVisibleCount > HOVER_ANIMATION_THRESHOLD;
  const useLowDetail = zoomLevel < 0.4;

  const layerTransform = {
    x: centerX + panOffset.x,
    y: centerY + panOffset.y,
    scaleX: zoomLevel,
    scaleY: zoomLevel,
    offsetX: centerX,
    offsetY: centerY,
  };

  const staticSeats = visibleSeats.filter(
    (s) => s.id !== selectedSeatId && s.id !== draggedSeatId
  );
  const selectedSeat = visibleSeats.find((s) => s.id === selectedSeatId);
  const draggedSeat = visibleSeats.find((s) => s.id === draggedSeatId);

  const staticSections = visibleSections.filter(
    (s) => s.id !== selectedSectionId && s.id !== draggedSectionId
  );
  const selectedSection = visibleSections.find((s) => s.id === selectedSectionId);
  const draggedSection = visibleSections.find((s) => s.id === draggedSectionId);

  // Show loading indicator while image is loading or image dimensions are invalid
  if (imageLoading || !image || !image.width || !image.height) {
    return (
      <div
        style={{
          width: validWidth,
          height: validHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
          borderRadius: "0.5rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid #e5e7eb",
              borderTop: "4px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#6b7280", fontSize: "14px" }}>Loading image...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Stage
      ref={stageRef}
      width={validWidth}
      height={validHeight}
      onWheel={(e) => {
        // Always prevent default to stop page from scrolling
        e.evt.preventDefault();
        onWheel?.(e, isSpacePressed);
      }}
      onTouchStart={(e) => {
        // Prevent browser from handling touch as scroll
        if (e.evt) {
          e.evt.preventDefault();
        }
      }}
      onMouseDown={(e) => {
        // Reset ignore click ref on new interaction
        ignoreClickRef.current = false;
        
        // Prevent default browser behavior (scrolling, text selection)
        if(e.evt) {
          e.evt.preventDefault();
        }
        
        const stage = e.target.getStage();
        if (!stage) return;

        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;

        // If Space is pressed, start panning
        if (isSpacePressed) {
          setIsPanning(true);
          setPanStartPos(pointerPos);
          onPanStart?.();
          return;
        }

        const target = e.target;
        const targetType = target.getType();

        // Detect if click is on a marker or transformer (don't start marquee in those cases)
        const isTransformer = targetType === "Transformer";
        let current: Konva.Node | null = target;
        let isTransformerRelated = false;
        while (current) {
          if (current.getType() === "Transformer") {
            isTransformerRelated = true;
            break;
          }
          current = current.getParent();
        }

        const isMarkerGroup =
          target.name() === "seat-marker" || target.name() === "section-marker";
        const isMarkerChild =
          target.getParent()?.name() === "seat-marker" ||
          target.getParent()?.name() === "section-marker";
        let ancestor: Konva.Node | null = target.getParent();
        let isMarkerAncestor = false;
        while (ancestor) {
          if (
            ancestor.name() === "seat-marker" ||
            ancestor.name() === "section-marker"
          ) {
            isMarkerAncestor = true;
            break;
          }
          ancestor = ancestor.getParent();
        }

        const isClickOnMarkerOrTransformer =
          isTransformer ||
          isTransformerRelated ||
          isMarkerGroup ||
          isMarkerChild ||
          isMarkerAncestor;

        // Drag-to-select: start marquee when clicking on empty area (not on a marker/transformer) and no shape tool
        if (
          !readOnly &&
          onMarkersInRect &&
          !selectedShapeTool &&
          !isDrawingShape &&
          !isClickOnMarkerOrTransformer
        ) {
          setSelectionStart(pointerPos);
          setSelectionCurrent(pointerPos);
          return;
        }

        const hasSelectedMarker =
          selectedSeatIdSet.size > 0 || selectedSectionIdSet.size > 0;

        if (
          hasSelectedMarker &&
          isClickOnMarkerOrTransformer
        ) {
          setIsDrawingShape(false);
          setDrawStartPos(null);
          setDrawCurrentPos(null);
          return;
        }

        if (
          selectedShapeTool &&
          onShapeDraw &&
          selectedShapeTool !== PlacementShapeType.FREEFORM
        ) {
          const percentageCoords = pointerToPercentage(
            pointerPos.x,
            pointerPos.y
          );
          setIsDrawingShape(true);
          setDrawStartPos(percentageCoords);
          setDrawCurrentPos(percentageCoords);
          return;
        }
      }}
      onMouseMove={(e) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;

        // Update drag-to-select marquee
        if (selectionStart) {
          setSelectionCurrent(pointerPos);
          return;
        }

        const target = e.target;
        const targetType = target.getType();
        const isTransformer = targetType === "Transformer";
        let current: Konva.Node | null = target;
        let isTransformerRelated = false;
        while (current) {
          if (current.getType() === "Transformer") {
            isTransformerRelated = true;
            break;
          }
          current = current.getParent();
        }

        const isMarkerGroup =
          target.name() === "seat-marker" || target.name() === "section-marker";
        const isMarkerChild =
          target.getParent()?.name() === "seat-marker" ||
          target.getParent()?.name() === "section-marker";
        let ancestor: Konva.Node | null = target.getParent();
        let isMarkerAncestor = false;
        while (ancestor) {
          if (
            ancestor.name() === "seat-marker" ||
            ancestor.name() === "section-marker"
          ) {
            isMarkerAncestor = true;
            break;
          }
          ancestor = ancestor.getParent();
        }
        const hasSelectedMarker =
          selectedSeatIdSet.size > 0 || selectedSectionIdSet.size > 0;
        const isInteractingWithMarker =
          hasSelectedMarker &&
          (isTransformer ||
            isTransformerRelated ||
            isMarkerGroup ||
            isMarkerChild ||
            isMarkerAncestor);

        if (isPanning && isSpacePressed) {
          const delta = {
            x: pointerPos.x - panStartPos.x,
            y: pointerPos.y - panStartPos.y,
          };

          setPanStartPos(pointerPos);
          onPan?.(delta);
        } else if (
          !isInteractingWithMarker &&
          isDrawingShape &&
          drawStartPos &&
          selectedShapeTool &&
          selectedShapeTool !== PlacementShapeType.FREEFORM
        ) {
          const percentageCoords = pointerToPercentage(
            pointerPos.x,
            pointerPos.y
          );
          setDrawCurrentPos(percentageCoords);
        } else if (
          !isInteractingWithMarker &&
          selectedShapeTool === PlacementShapeType.FREEFORM &&
          freeformPath.length > 0
        ) {
          const percentageCoords = pointerToPercentage(
            pointerPos.x,
            pointerPos.y
          );
          setFreeformHoverPos(percentageCoords);
        }
      }}
      onMouseUp={(e) => {
        if (isPanning) {
          setIsPanning(false);
          onPanEnd?.();
          return;
        }

        // Finish drag-to-select marquee
        if (selectionStart && selectionCurrent && onMarkersInRect) {
          const x1 = Math.min(selectionStart.x, selectionCurrent.x);
          const y1 = Math.min(selectionStart.y, selectionCurrent.y);
          const x2 = Math.max(selectionStart.x, selectionCurrent.x);
          const y2 = Math.max(selectionStart.y, selectionCurrent.y);
          const p1 = stageToPercentage(x1, y1);
          const p2 = stageToPercentage(x2, y2);
          const minPx = Math.min(p1.x, p2.x);
          const maxPx = Math.max(p1.x, p2.x);
          const minPy = Math.min(p1.y, p2.y);
          const maxPy = Math.max(p1.y, p2.y);
          const seatIds = seats.filter(
            (s) =>
              s.x >= minPx &&
              s.x <= maxPx &&
              s.y >= minPy &&
              s.y <= maxPy
          ).map((s) => s.id);
          const sectionIds = sections.filter(
            (s) =>
              s.x >= minPx &&
              s.x <= maxPx &&
              s.y >= minPy &&
              s.y <= maxPy
          ).map((s) => s.id);
          onMarkersInRect(seatIds, sectionIds);
          setSelectionStart(null);
          setSelectionCurrent(null);
          return;
        }

        const target = e.target;
        const targetType = target.getType();
        const isTransformer = targetType === "Transformer";
        let current: Konva.Node | null = target;
        let isTransformerRelated = false;
        while (current) {
          if (current.getType() === "Transformer") {
            isTransformerRelated = true;
            break;
          }
          current = current.getParent();
        }

        const isMarkerGroup =
          target.name() === "seat-marker" || target.name() === "section-marker";
        const isMarkerChild =
          target.getParent()?.name() === "seat-marker" ||
          target.getParent()?.name() === "section-marker";
        let ancestor: Konva.Node | null = target.getParent();
        let isMarkerAncestor = false;
        while (ancestor) {
          if (
            ancestor.name() === "seat-marker" ||
            ancestor.name() === "section-marker"
          ) {
            isMarkerAncestor = true;
            break;
          }
          ancestor = ancestor.getParent();
        }
        const hasSelectedMarker =
          selectedSeatIdSet.size > 0 || selectedSectionIdSet.size > 0;
        const isInteractingWithMarker =
          hasSelectedMarker &&
          (isTransformer ||
            isTransformerRelated ||
            isMarkerGroup ||
            isMarkerChild ||
            isMarkerAncestor);

        if (isInteractingWithMarker) {
          setIsDrawingShape(false);
          setDrawStartPos(null);
          setDrawCurrentPos(null);
          return;
        }

        if (
          isDrawingShape &&
          drawStartPos &&
          selectedShapeTool &&
          onShapeDraw
        ) {
          // Freeform is now handled via click-to-add-points, not mouseUp
          // So we skip it here and only handle other shape types
          if (
            selectedShapeTool !== PlacementShapeType.FREEFORM &&
            drawCurrentPos
          ) {
            // Handle other shape types (drag to draw)
            const startX = drawStartPos.x;
            const startY = drawStartPos.y;
            const endX = drawCurrentPos.x;
            const endY = drawCurrentPos.y;

            // Calculate distance moved - require minimum drag distance
            const distance = Math.sqrt(
              Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
            );
            const minDragDistance = 0.3; // 0.3% of image - minimum drag distance to create shape

            if (distance >= minDragDistance) {
              // Prevent click event from propagating to Image onClick handler
              // This prevents duplicate creation (one from drag, one from click)
              e.cancelBubble = true;
              
              // Set ref to ignore subsequent click event
              ignoreClickRef.current = true;

              // Valid drag - create shape with dragged dimensions
              const minSize = 1.5; // 1.5% of image
              const width = Math.max(minSize, Math.abs(endX - startX));
              const height = Math.max(minSize, Math.abs(endY - startY));

              const centerX = (startX + endX) / 2;
              const centerY = (startY + endY) / 2;

              // Create shape based on type with reasonable defaults
              let shape: PlacementShape;
              if (selectedShapeTool === PlacementShapeType.CIRCLE) {
                const radius = Math.max(width, height) / 2;
                shape = {
                  type: PlacementShapeType.CIRCLE,
                  radius: Math.max(0.8, radius), // Minimum 0.8% for visibility
                };
                onShapeDraw(shape, centerX, centerY);
              } else if (selectedShapeTool === PlacementShapeType.RECTANGLE) {
                shape = {
                  type: PlacementShapeType.RECTANGLE,
                  width: Math.max(1.0, width),
                  height: Math.max(1.0, height),
                  cornerRadius: 2, // Slight rounding for better appearance
                };
                onShapeDraw(shape, centerX, centerY, width, height);
              } else if (selectedShapeTool === PlacementShapeType.ELLIPSE) {
                shape = {
                  type: PlacementShapeType.ELLIPSE,
                  width: Math.max(1.0, width),
                  height: Math.max(1.0, height),
                };
                onShapeDraw(shape, centerX, centerY, width, height);
              } else if (selectedShapeTool === PlacementShapeType.POLYGON) {
                // For polygon, use hexagon shape scaled to drag size
                // Base hexagon points (relative to center)
                const basePoints = [
                  -1, -1, 1, -1, 1.5, 0, 1, 1, -1, 1, -1.5, 0,
                ];
                // Scale points based on drag dimensions
                const scaleX = width / 2; // Divide by 2 because base points range from -1.5 to 1.5
                const scaleY = height / 2;
                const scaledPoints = basePoints.map((p, index) => {
                  if (index % 2 === 0) {
                    // x coordinate
                    return p * scaleX;
                  } else {
                    // y coordinate
                    return p * scaleY;
                  }
                });
                shape = {
                  type: PlacementShapeType.POLYGON,
                  points: scaledPoints,
                };

                onShapeDraw(shape, centerX, centerY);
              }
            }
          }
          // If drag was too small, just cancel the drawing without creating anything

          // Reset drawing state
          setIsDrawingShape(false);
          setDrawStartPos(null);
          setDrawCurrentPos(null);
        }
      }}
      onMouseLeave={() => {
        if (isPanning) {
          setIsPanning(false);
          onPanEnd?.();
        }
        setSelectionStart(null);
        setSelectionCurrent(null);
      }}
      style={{
        display: "block",
        willChange: "transform",
        cursor:
          isPanning || isSpacePressed
            ? "grab"
            : selectedShapeTool
              ? "crosshair"
              : "pointer", // Pointer tool shows pointer cursor
      }}
    >
      {/* Background Layer: Image only - rarely redraws */}
      <Layer ref={layerRef} {...layerTransform} listening={true}>
        <Image
          name="background-image"
          image={image}
          x={imageX}
          y={imageY}
          width={displayedWidth}
          height={displayedHeight}
          listening={true}
          onMouseMove={(e) => {
            if (
              selectedShapeTool === PlacementShapeType.FREEFORM &&
              freeformPath.length > 0
            ) {
              const pointerPos = e.target.getStage()?.getPointerPosition();
              if (pointerPos) {
                const percentageCoords = pointerToPercentage(
                  pointerPos.x,
                  pointerPos.y
                );
                setFreeformHoverPos(percentageCoords);
              }
            }
          }}
          onClick={(e) => {
            if (ignoreClickRef.current) {
              ignoreClickRef.current = false;
              return;
            }
            if (
              selectedShapeTool === PlacementShapeType.FREEFORM &&
              onShapeDraw
            ) {
              e.cancelBubble = true;
              const pointerPos = e.target.getStage()?.getPointerPosition();
              if (pointerPos) {
                const percentageCoords = pointerToPercentage(
                  pointerPos.x,
                  pointerPos.y
                );
                if (freeformPath.length >= 2) {
                  const firstPoint = freeformPath[0];
                  const distanceToStart = Math.sqrt(
                    Math.pow(percentageCoords.x - firstPoint.x, 2) +
                      Math.pow(percentageCoords.y - firstPoint.y, 2)
                  );
                  if (distanceToStart < 1.5) {
                    const finalPath = [...freeformPath, firstPoint];
                    const sumX = finalPath.reduce((sum, p) => sum + p.x, 0);
                    const sumY = finalPath.reduce((sum, p) => sum + p.y, 0);
                    const cx = sumX / finalPath.length;
                    const cy = sumY / finalPath.length;
                    const points: number[] = [];
                    finalPath.forEach((point) => {
                      points.push(point.x - cx, point.y - cy);
                    });
                    const shape: PlacementShape = {
                      type: PlacementShapeType.FREEFORM,
                      points,
                    };
                    onShapeDraw(shape, cx, cy);
                    setFreeformPath([]);
                    setFreeformHoverPos(null);
                    return;
                  }
                }
                setFreeformPath((prev) => {
                  if (prev.length === 0) return [percentageCoords];
                  const lastPoint = prev[prev.length - 1];
                  const distanceInPercent = Math.sqrt(
                    Math.pow(percentageCoords.x - lastPoint.x, 2) +
                      Math.pow(percentageCoords.y - lastPoint.y, 2)
                  );
                  if (distanceInPercent >= 0.1) return [...prev, percentageCoords];
                  return prev;
                });
              }
              return;
            }
            const target = e.target;
            if (
              target &&
              target.name() === "background-image" &&
              !selectedShapeTool &&
              !isDrawingShape
            ) {
              onDeselect?.();
            }
            if (onImageClick) {
              const pointerPos = e.target.getStage()?.getPointerPosition();
              if (pointerPos) {
                const percentageCoords = pointerToPercentage(
                  pointerPos.x,
                  pointerPos.y
                );
                onImageClick(e, percentageCoords);
              } else {
                onImageClick(e);
              }
            }
          }}
          onDblClick={(e) => {
            if (
              selectedShapeTool === PlacementShapeType.FREEFORM &&
              freeformPath.length >= 2 &&
              onShapeDraw
            ) {
              e.cancelBubble = true;
              const finalPath = [...freeformPath, freeformPath[0]];
              const sumX = finalPath.reduce((sum, p) => sum + p.x, 0);
              const sumY = finalPath.reduce((sum, p) => sum + p.y, 0);
              const cx = sumX / finalPath.length;
              const cy = sumY / finalPath.length;
              const points: number[] = [];
              finalPath.forEach((point) => {
                points.push(point.x - cx, point.y - cy);
              });
              const shape: PlacementShape = {
                type: PlacementShapeType.FREEFORM,
                points,
              };
              onShapeDraw(shape, cx, cy);
              setFreeformPath([]);
              setFreeformHoverPos(null);
            }
          }}
          onTap={(e) => {
            const target = e.target;
            if (
              target &&
              target.name() === "background-image" &&
              !selectedShapeTool &&
              !isDrawingShape
            ) {
              onDeselect?.();
            }
          }}
        />
      </Layer>

      {/* Static Layer: Non-selected, non-dragged - redraws only on selection/drag-end */}
      <Layer {...layerTransform} listening={true}>
        {staticSeats.map((seat) => {
          const { x, y } = percentageToStage(seat.x, seat.y);
          const colors = getSeatMarkerColors(seat);
          return (
            <MemoizedSeatMarkerComponent
              key={seat.id}
              seat={seat}
              x={x}
              y={y}
              isSelected={selectedSeatIdSet.has(seat.id)}
              isPlacingSeats={isPlacingSeats}
              isPanning={isPanning}
              isSpacePressed={isSpacePressed}
              isPlacingSections={isPlacingSections}
              selectedShapeTool={selectedShapeTool}
              onSeatClick={onSeatClick}
              onSeatDragStart={handleSeatDragStart}
              onSeatDragEnd={handleSeatDragEnd}
              onShapeTransform={onSeatShapeTransform}
              colors={colors}
              imageWidth={displayedWidth}
              imageHeight={displayedHeight}
              readOnly={readOnly}
              disableHoverAnimation={disableHoverAnimation}
              useLowDetail={useLowDetail}
            />
          );
        })}
        {venueType === "large" &&
          staticSections.map((section) => {
            const { x, y } = percentageToStage(section.x, section.y);
            return (
              <MemoizedSectionMarkerComponent
                key={section.id}
                section={section}
                x={x}
                y={y}
                isSelected={selectedSectionIdSet.has(section.id)}
                isPlacingSections={isPlacingSections}
                isPanning={isPanning}
                isSpacePressed={isSpacePressed}
                isPlacingSeats={isPlacingSeats}
                onSectionClick={onSectionClick}
                onSectionDoubleClick={onSectionDoubleClick}
                onSectionDragEnd={handleSectionDragEnd}
                onSectionDragStart={handleSectionDragStart}
                selectedShapeTool={selectedShapeTool}
                onShapeTransform={onSectionShapeTransform}
                colors={getSectionMarkerColors(section)}
                imageWidth={displayedWidth}
                imageHeight={displayedHeight}
                readOnly={readOnly}
                disableHoverAnimation={disableHoverAnimation}
                useLowDetail={useLowDetail}
              />
            );
          })}
        {visibleShapeOverlays.map((overlay) => {
          const isSelected = selectedOverlayId === overlay.id;
          return (
            <MemoizedShapeOverlayComponent
              key={overlay.id}
              overlay={overlay}
              isSelected={isSelected}
              onShapeOverlayClick={onShapeOverlayClick}
              imageWidth={displayedWidth}
              imageHeight={displayedHeight}
              isPanning={isPanning}
              isSpacePressed={isSpacePressed}
              selectedShapeTool={selectedShapeTool}
              isPlacingSeats={isPlacingSeats}
              isPlacingSections={isPlacingSections}
              percentageToStage={percentageToStage}
              disableHoverAnimation={disableHoverAnimation}
            />
          );
        })}
      </Layer>

      {/* Interactive Layer: Selected seat/section + Transformer */}
      <Layer {...layerTransform} listening={true}>
        {selectedSeat && (
          <>
            {(() => {
              const { x, y } = percentageToStage(selectedSeat.x, selectedSeat.y);
              const colors = getSeatMarkerColors(selectedSeat);
              return (
                <MemoizedSeatMarkerComponent
                  key={selectedSeat.id}
                  seat={selectedSeat}
                  x={x}
                  y={y}
                  isSelected={true}
                  isPlacingSeats={isPlacingSeats}
                  isPanning={isPanning}
                  isSpacePressed={isSpacePressed}
                  isPlacingSections={isPlacingSections}
                  selectedShapeTool={selectedShapeTool}
                  onSeatClick={onSeatClick}
                  onSeatDragStart={handleSeatDragStart}
                  onSeatDragEnd={handleSeatDragEnd}
                  onShapeTransform={onSeatShapeTransform}
                  colors={colors}
                  imageWidth={displayedWidth}
                  imageHeight={displayedHeight}
                  readOnly={readOnly}
                  disableHoverAnimation={disableHoverAnimation}
                  useLowDetail={false}
                />
              );
            })()}
          </>
        )}
        {venueType === "large" &&
          selectedSection && (
            (() => {
              const { x, y } = percentageToStage(
                selectedSection.x,
                selectedSection.y
              );
              return (
                <MemoizedSectionMarkerComponent
                  key={selectedSection.id}
                  section={selectedSection}
                  x={x}
                  y={y}
                  isSelected={true}
                  isPlacingSections={isPlacingSections}
                  isPanning={isPanning}
                  isSpacePressed={isSpacePressed}
                  isPlacingSeats={isPlacingSeats}
                  onSectionClick={onSectionClick}
                  onSectionDoubleClick={onSectionDoubleClick}
                  onSectionDragEnd={handleSectionDragEnd}
                  onSectionDragStart={handleSectionDragStart}
                  selectedShapeTool={selectedShapeTool}
                  onShapeTransform={onSectionShapeTransform}
                  colors={getSectionMarkerColors(selectedSection)}
                  imageWidth={displayedWidth}
                  imageHeight={displayedHeight}
                  readOnly={readOnly}
                  disableHoverAnimation={disableHoverAnimation}
                  useLowDetail={false}
                />
              );
            })()
          )}
      </Layer>

      {/* Drag Layer: Currently dragged shape - only this redraws during drag */}
      <Layer {...layerTransform} listening={true}>
        {draggedSeat && (
          (() => {
            const { x, y } = percentageToStage(draggedSeat.x, draggedSeat.y);
            const colors = getSeatMarkerColors(draggedSeat);
            return (
              <MemoizedSeatMarkerComponent
                key={draggedSeat.id}
                seat={draggedSeat}
                x={x}
                y={y}
                isSelected={false}
                isPlacingSeats={isPlacingSeats}
                isPanning={isPanning}
                isSpacePressed={isSpacePressed}
                isPlacingSections={isPlacingSections}
                selectedShapeTool={selectedShapeTool}
                onSeatClick={onSeatClick}
                onSeatDragStart={handleSeatDragStart}
                onSeatDragEnd={handleSeatDragEnd}
                onShapeTransform={onSeatShapeTransform}
                colors={colors}
                imageWidth={displayedWidth}
                imageHeight={displayedHeight}
                readOnly={readOnly}
                disableHoverAnimation={disableHoverAnimation}
                useLowDetail={false}
              />
            );
          })()
        )}
        {venueType === "large" &&
          draggedSection && (
            (() => {
              const { x, y } = percentageToStage(
                draggedSection.x,
                draggedSection.y
              );
              return (
                <MemoizedSectionMarkerComponent
                  key={draggedSection.id}
                  section={draggedSection}
                  x={x}
                  y={y}
                  isSelected={false}
                  isPlacingSections={isPlacingSections}
                  isPanning={isPanning}
                  isSpacePressed={isSpacePressed}
                  isPlacingSeats={isPlacingSeats}
                  onSectionClick={onSectionClick}
                  onSectionDoubleClick={onSectionDoubleClick}
                  onSectionDragEnd={handleSectionDragEnd}
                  onSectionDragStart={handleSectionDragStart}
                  selectedShapeTool={selectedShapeTool}
                  onShapeTransform={onSectionShapeTransform}
                  colors={getSectionMarkerColors(draggedSection)}
                  imageWidth={displayedWidth}
                  imageHeight={displayedHeight}
                  readOnly={readOnly}
                  disableHoverAnimation={disableHoverAnimation}
                  useLowDetail={false}
                />
              );
            })()
          )}
      </Layer>

      {/* Overlay Layer: Preview shapes, freeform lines, etc. */}
      <Layer
        {...layerTransform}
        listening={true}
        onClick={(e) => {
          // Handle polygon/freeform click-to-add-points at Layer level
          // This ensures clicks work even when seats/sections are on top
          if (
            selectedShapeTool === PlacementShapeType.FREEFORM &&
            onShapeDraw
          ) {
            // Only handle if clicking on the layer itself (not on a marker)
            const target = e.target;
            // If clicking on a marker, let it handle the click
            if (
              target &&
              (target.name() === "seat-marker" ||
                target.name() === "section-marker")
            ) {
              return;
            }

            e.cancelBubble = true;
            const pointerPos = e.target.getStage()?.getPointerPosition();
            if (pointerPos) {
              const percentageCoords = pointerToPercentage(
                pointerPos.x,
                pointerPos.y
              );

              // Check if clicking near the first point to close the shape (need at least 2 points)
              if (freeformPath.length >= 2) {
                const firstPoint = freeformPath[0];
                const distanceToStart = Math.sqrt(
                  Math.pow(percentageCoords.x - firstPoint.x, 2) +
                    Math.pow(percentageCoords.y - firstPoint.y, 2)
                );

                // If clicking within 1.5% of the start point, close the shape
                if (distanceToStart < 1.5) {
                  // Complete the shape by closing to the first point
                  const finalPath = [...freeformPath, firstPoint]; // Add first point at end to close
                  const sumX = finalPath.reduce((sum, p) => sum + p.x, 0);
                  const sumY = finalPath.reduce((sum, p) => sum + p.y, 0);
                  const centerX = sumX / finalPath.length;
                  const centerY = sumY / finalPath.length;

                  const points: number[] = [];
                  finalPath.forEach((point) => {
                    points.push(point.x - centerX, point.y - centerY);
                  });

                  const shape: PlacementShape = {
                    type: PlacementShapeType.FREEFORM,
                    points,
                  };
                  onShapeDraw(shape, centerX, centerY);

                  // Reset freeform path and hover position
                  setFreeformPath([]);
                  setFreeformHoverPos(null);
                  return;
                }
              }

              // Add new point to the path
              setFreeformPath((prev) => {
                if (prev.length === 0) {
                  return [percentageCoords];
                }
                const lastPoint = prev[prev.length - 1];

                // Calculate distance in percentage for threshold checking
                // This works consistently regardless of zoom level or image size
                const distanceInPercent = Math.sqrt(
                  Math.pow(percentageCoords.x - lastPoint.x, 2) +
                    Math.pow(percentageCoords.y - lastPoint.y, 2)
                );

                // Use a percentage-based threshold (0.1%) to prevent exact duplicate clicks
                // This allows adding points very close together for tight shapes like rectangles/polygons
                // and works consistently in all directions and at all zoom levels
                if (distanceInPercent >= 0.1) {
                  return [...prev, percentageCoords];
                }
                return prev;
              });
            }
          }
        }}
      >
        {/* Hit area for freeform - passes through to lower layers for seat clicks */}
        <Rect
          x={imageX}
          y={imageY}
          width={displayedWidth}
          height={displayedHeight}
          fill="transparent"
          listening={false}
          onMouseMove={(e) => {
            // Track hover position for freeform preview
            if (
              selectedShapeTool === PlacementShapeType.FREEFORM &&
              freeformPath.length > 0
            ) {
              const pointerPos = e.target.getStage()?.getPointerPosition();
              if (pointerPos) {
                const percentageCoords = pointerToPercentage(
                  pointerPos.x,
                  pointerPos.y
                );
                setFreeformHoverPos(percentageCoords);
              }
            }
          }}
          onClick={(e) => {
            // Check if we should ignore this click (e.g. after drag-to-draw)
            if (ignoreClickRef.current) {
                ignoreClickRef.current = false;
                return;
            }

            // Handle freeform click-to-add-points
            if (
              selectedShapeTool === PlacementShapeType.FREEFORM &&
              onShapeDraw
            ) {
              e.cancelBubble = true;
              const pointerPos = e.target.getStage()?.getPointerPosition();
              if (pointerPos) {
                const percentageCoords = pointerToPercentage(
                  pointerPos.x,
                  pointerPos.y
                );

                // Check if clicking near the first point to close the shape (need at least 2 points)
                if (freeformPath.length >= 2) {
                  const firstPoint = freeformPath[0];
                  const distanceToStart = Math.sqrt(
                    Math.pow(percentageCoords.x - firstPoint.x, 2) +
                      Math.pow(percentageCoords.y - firstPoint.y, 2)
                  );

                  // If clicking within 1.5% of the start point, close the shape
                  if (distanceToStart < 1.5) {
                    // Complete the shape by closing to the first point
                    const finalPath = [...freeformPath, firstPoint]; // Add first point at end to close
                    const sumX = finalPath.reduce((sum, p) => sum + p.x, 0);
                    const sumY = finalPath.reduce((sum, p) => sum + p.y, 0);
                    const centerX = sumX / finalPath.length;
                    const centerY = sumY / finalPath.length;

                    const points: number[] = [];
                    finalPath.forEach((point) => {
                      points.push(point.x - centerX, point.y - centerY);
                    });

                    const shape: PlacementShape = {
                      type: PlacementShapeType.FREEFORM,
                      points,
                    };
                    onShapeDraw(shape, centerX, centerY);

                    // Reset freeform path and hover position
                    setFreeformPath([]);
                    setFreeformHoverPos(null);
                    return;
                  }
                }

                // Add new point to the path
                setFreeformPath((prev) => {
                  if (prev.length === 0) {
                    return [percentageCoords];
                  }
                  const lastPoint = prev[prev.length - 1];

                  // Calculate distance in percentage for threshold checking
                  // This works consistently regardless of zoom level or image size
                  const distanceInPercent = Math.sqrt(
                    Math.pow(percentageCoords.x - lastPoint.x, 2) +
                      Math.pow(percentageCoords.y - lastPoint.y, 2)
                  );

                  // Use a percentage-based threshold (0.1%) to prevent exact duplicate clicks
                  // This allows adding points very close together for tight shapes like rectangles/polygons
                  // and works consistently in all directions and at all zoom levels
                  if (distanceInPercent >= 0.1) {
                    return [...prev, percentageCoords];
                  }
                  return prev;
                });
              }
              return;
            }

            // Only deselect if clicking directly on the image (not on a marker)
            // Markers use e.cancelBubble = true to prevent this from firing
            // Also don't deselect if we're drawing a shape or if a shape tool is selected
            const target = e.target;
            if (
              target &&
              target.name() === "background-image" &&
              !selectedShapeTool &&
              !isDrawingShape
            ) {
              onDeselect?.();
            }
            // Also call onImageClick if provided
            if (onImageClick) {
              const pointerPos = e.target.getStage()?.getPointerPosition();
              if (pointerPos) {
                const percentageCoords = pointerToPercentage(
                  pointerPos.x,
                  pointerPos.y
                );
                onImageClick(e, percentageCoords);
              } else {
                onImageClick(e);
              }
            }
          }}
          onDblClick={(e) => {
            // Double-click to complete freeform shape by closing to the initial point
            if (
              selectedShapeTool === PlacementShapeType.FREEFORM &&
              freeformPath.length >= 2 &&
              onShapeDraw
            ) {
              e.cancelBubble = true;
              // Close the shape by adding the first point at the end
              const finalPath = [...freeformPath, freeformPath[0]]; // Add first point at end to close
              const sumX = finalPath.reduce((sum, p) => sum + p.x, 0);
              const sumY = finalPath.reduce((sum, p) => sum + p.y, 0);
              const centerX = sumX / finalPath.length;
              const centerY = sumY / finalPath.length;

              const points: number[] = [];
              finalPath.forEach((point) => {
                points.push(point.x - centerX, point.y - centerY);
              });

              const shape: PlacementShape = {
                type: PlacementShapeType.FREEFORM,
                points,
              };
              onShapeDraw(shape, centerX, centerY);

              // Reset freeform path and hover position
              setFreeformPath([]);
              setFreeformHoverPos(null);
            }
          }}
          onTap={(e) => {
            // Handle tap for mobile devices
            const target = e.target;
            if (
              target &&
              target.name() === "background-image" &&
              !selectedShapeTool &&
              !isDrawingShape
            ) {
              onDeselect?.();
            }
          }}
        />

        {/* Preview shape while drawing - show freeform preview when points exist */}
        {selectedShapeTool === PlacementShapeType.FREEFORM &&
          freeformPath.length > 0 &&
          (() => {
            // Show lines connecting clicked points (straight lines between consecutive points)
            // Plus a preview line from the last point to the cursor
            const lines: Array<{ points: number[]; x: number; y: number }> = [];

            // Draw lines between clicked points (straight lines)
            for (let i = 0; i < freeformPath.length - 1; i++) {
              const startPoint = freeformPath[i];
              const endPoint = freeformPath[i + 1];
              const { x: startX, y: startY } = percentageToStage(
                startPoint.x,
                startPoint.y
              );
              const { x: endX, y: endY } = percentageToStage(
                endPoint.x,
                endPoint.y
              );

              lines.push({
                points: [0, 0, endX - startX, endY - startY], // Relative to start point
                x: startX,
                y: startY,
              });
            }

            // Draw preview line from last clicked point to cursor (if hovering)
            if (freeformHoverPos && freeformPath.length > 0) {
              const lastPoint = freeformPath[freeformPath.length - 1];
              const { x: lastX, y: lastY } = percentageToStage(
                lastPoint.x,
                lastPoint.y
              );
              const { x: hoverX, y: hoverY } = percentageToStage(
                freeformHoverPos.x,
                freeformHoverPos.y
              );

              lines.push({
                points: [0, 0, hoverX - lastX, hoverY - lastY], // Relative to last point
                x: lastX,
                y: lastY,
              });
            }

            return (
              <>
                {lines.map((line, index) => (
                  <Line
                    key={`freeform-preview-${index}`}
                    points={line.points}
                    x={line.x}
                    y={line.y}
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    opacity={0.8}
                    dash={index === lines.length - 1 ? [5, 5] : undefined} // Dashed for preview line
                  />
                ))}
              </>
            );
          })()}

        {/* Preview shape while drawing - for other shape types */}
        {isDrawingShape &&
          drawStartPos &&
          selectedShapeTool &&
          selectedShapeTool !== PlacementShapeType.FREEFORM &&
          (() => {
            // Handle other shape types (drag to draw)
            if (drawCurrentPos) {
              const startX = drawStartPos.x;
              const startY = drawStartPos.y;
              const endX = drawCurrentPos.x;
              const endY = drawCurrentPos.y;

              const minSize = 1.5;
              const width = Math.max(minSize, Math.abs(endX - startX));
              const height = Math.max(minSize, Math.abs(endY - startY));

              const centerX = (startX + endX) / 2;
              const centerY = (startY + endY) / 2;

              const { x, y } = percentageToStage(centerX, centerY);

              let previewShape: PlacementShape;
              if (selectedShapeTool === PlacementShapeType.CIRCLE) {
                const radius = Math.max(width, height) / 2;
                previewShape = {
                  type: PlacementShapeType.CIRCLE,
                  radius: Math.max(0.8, radius),
                };
              } else if (selectedShapeTool === PlacementShapeType.RECTANGLE) {
                previewShape = {
                  type: PlacementShapeType.RECTANGLE,
                  width: Math.max(1.0, width),
                  height: Math.max(1.0, height),
                  cornerRadius: 2,
                };
              } else if (selectedShapeTool === PlacementShapeType.ELLIPSE) {
                previewShape = {
                  type: PlacementShapeType.ELLIPSE,
                  width: Math.max(1.0, width),
                  height: Math.max(1.0, height),
                };
              } else if (selectedShapeTool === PlacementShapeType.POLYGON) {
                // For polygon, use hexagon shape scaled to drag size
                // Base hexagon points (relative to center)
                const basePoints = [
                  -1, -1, 1, -1, 1.5, 0, 1, 1, -1, 1, -1.5, 0,
                ];
                // Scale points based on drag dimensions
                const scaleX = width / 2; // Divide by 2 because base points range from -1.5 to 1.5
                const scaleY = height / 2;
                const scaledPoints = basePoints.map((p, index) => {
                  if (index % 2 === 0) {
                    // x coordinate
                    return p * scaleX;
                  } else {
                    // y coordinate
                    return p * scaleY;
                  }
                });
                previewShape = {
                  type: PlacementShapeType.POLYGON,
                  points: scaledPoints,
                };
              } else {
                // Fallback (shouldn't happen)
                previewShape = {
                  type: PlacementShapeType.POLYGON,
                  points: [-1, -1, 1, -1, 1.5, 0, 1, 1, -1, 1, -1.5, 0],
                };
              }

              return (
                <Group ref={previewShapeRef} x={x} y={y}>
                  <ShapeRenderer
                    shape={previewShape}
                    fill="rgba(59, 130, 246, 0.15)"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    imageWidth={displayedWidth}
                    imageHeight={displayedHeight}
                    opacity={0.8}
                  />
                </Group>
              );
            }

            return null;
          })()}
      </Layer>

      {/* Selection marquee (stage coordinates, on top) */}
      {selectionStart && selectionCurrent && (
        <Layer listening={false}>
          <Rect
            x={Math.min(selectionStart.x, selectionCurrent.x)}
            y={Math.min(selectionStart.y, selectionCurrent.y)}
            width={Math.abs(selectionCurrent.x - selectionStart.x)}
            height={Math.abs(selectionCurrent.y - selectionStart.y)}
            stroke="#2563eb"
            strokeWidth={2}
            dash={[6, 4]}
            fill="rgba(37, 99, 235, 0.08)"
          />
        </Layer>
      )}
    </Stage>
  );
}
