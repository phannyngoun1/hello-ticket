/**
 * Konva-based Canvas Component for Seat Designer
 *
 * Provides better performance and smoother interactions compared to DOM-based rendering
 */

import { useRef, useEffect, useState, useCallback } from "react";
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
}

function ShapeRenderer({
  shape,
  fill,
  stroke,
  strokeWidth,
  imageWidth,
  imageHeight,
  opacity = 1,
}: ShapeRendererProps) {
  const baseProps = {
    fill,
    stroke,
    strokeWidth,
    opacity,
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
      return <Circle {...baseProps} radius={radius} />;
    }

    case PlacementShapeType.RECTANGLE: {
      const width = shape.width ? (shape.width / 100) * imageWidth : 24; // Default width
      const height = shape.height ? (shape.height / 100) * imageHeight : 24; // Default height
      return (
        <Rect
          {...baseProps}
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          cornerRadius={shape.cornerRadius || 0}
        />
      );
    }

    case PlacementShapeType.ELLIPSE: {
      const radiusX = shape.width ? ((shape.width / 100) * imageWidth) / 2 : 12; // Default radiusX
      const radiusY = shape.height
        ? ((shape.height / 100) * imageHeight) / 2
        : 12; // Default radiusY
      return <Ellipse {...baseProps} radiusX={radiusX} radiusY={radiusY} />;
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
      return (
        <Line {...baseProps} points={points} closed={true} tension={0.5} />
      );
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
  isPlacingSeats: boolean;
  isPlacingSections: boolean;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  onSeatClick?: (seat: SeatMarker) => void;
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
  }>;
  selectedOverlayId?: string | null;
}

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
  onSeatClick?: (seat: SeatMarker) => void;
  onSeatDragEnd: (seatId: string, e: Konva.KonvaEventObject<DragEvent>) => void;
  onShapeTransform?: (seatId: string, shape: PlacementShape) => void;
  colors: { fill: string; stroke: string };
  imageWidth: number;
  imageHeight: number;
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
  onSeatClick,
  onSeatDragEnd,
  onShapeTransform,
  colors,
  imageWidth,
  imageHeight,
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

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && groupRef.current && transformerRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

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
    const shapeNode = shapeRef.current;
    if (!shapeNode || isSelected) return;

    // Determine hover stroke color - brighter version of the original stroke
    const hoverStrokeColor = isHovered ? colors.stroke : colors.stroke;

    shapeNode.to({
      stroke: hoverStrokeColor,
      strokeWidth: isHovered ? 2.5 : 2, // More visible border
      duration: 0.2,
      easing: Konva.Easings.EaseInOut,
    });
  }, [isHovered, isSelected, colors.stroke]);

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
      const newRadius = currentRadius * Math.max(scaleX, scaleY);
      updatedShape.radius =
        (newRadius / Math.min(imageWidth, imageHeight)) * 100;
    } else if (
      shape.type === PlacementShapeType.RECTANGLE ||
      shape.type === PlacementShapeType.ELLIPSE
    ) {
      const currentWidth = shape.width ? (shape.width / 100) * imageWidth : 30;
      const currentHeight = shape.height
        ? (shape.height / 100) * imageHeight
        : 20;
      updatedShape.width = ((currentWidth * scaleX) / imageWidth) * 100;
      updatedShape.height = ((currentHeight * scaleY) / imageHeight) * 100;
    } else if (shape.type === PlacementShapeType.FREEFORM && shape.points) {
      // Scale all points proportionally
      const avgScale = (scaleX + scaleY) / 2;
      updatedShape.points = shape.points.map((p) => p * avgScale);
    } else if (shape.type === PlacementShapeType.POLYGON && shape.points) {
      // Scale polygon points proportionally
      const avgScale = (scaleX + scaleY) / 2;
      updatedShape.points = shape.points.map((p) => p * avgScale);
    }

    updatedShape.rotation = rotation;
    onShapeTransform(seat.id, updatedShape);
  }, [shape, imageWidth, imageHeight, onShapeTransform, seat.id]);

  return (
    <>
      <Group
        ref={groupRef}
        x={x}
        y={y}
        rotation={shape.rotation || 0}
        draggable={isPlacingSeats || isSelected}
        onDragEnd={(e) => onSeatDragEnd(seat.id, e)}
        onTransformEnd={handleTransformEnd}
        onMouseDown={(e) => {
          e.cancelBubble = true;
        }}
        onClick={(e) => {
          e.cancelBubble = true;
          onSeatClick?.(seat);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSeatClick?.(seat);
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
          <ShapeRenderer
            shape={shape}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            opacity={fillOpacity}
          />
        </Group>
      </Group>
      {isSelected && (
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
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "top-center",
            "bottom-center",
            "left-center",
            "right-center",
          ]}
        />
      )}
    </>
  );
}

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
  onSectionClick?: (
    section: SectionMarker,
    event?: { shiftKey?: boolean }
  ) => void;
  onSectionDoubleClick?: (section: SectionMarker) => void;
  onSectionDragEnd?: (sectionId: string, newX: number, newY: number) => void;
  onShapeTransform?: (sectionId: string, shape: PlacementShape) => void;
  imageWidth: number;
  imageHeight: number;
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
  onSectionClick,
  onSectionDoubleClick,
  onSectionDragEnd,
  onShapeTransform,
  imageWidth,
  imageHeight,
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

  // Attach transformer when selected and shape exists
  useEffect(() => {
    if (
      isSelected &&
      section.shape &&
      groupRef.current &&
      transformerRef.current
    ) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, section.shape]);

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
      const newRadius = currentRadius * Math.max(scaleX, scaleY);
      updatedShape.radius =
        (newRadius / Math.min(imageWidth, imageHeight)) * 100;
    } else if (
      shape.type === PlacementShapeType.RECTANGLE ||
      shape.type === PlacementShapeType.ELLIPSE
    ) {
      const currentWidth = shape.width ? (shape.width / 100) * imageWidth : 30;
      const currentHeight = shape.height
        ? (shape.height / 100) * imageHeight
        : 20;
      updatedShape.width = ((currentWidth * scaleX) / imageWidth) * 100;
      updatedShape.height = ((currentHeight * scaleY) / imageHeight) * 100;
    } else if (shape.type === PlacementShapeType.FREEFORM && shape.points) {
      // Scale all points proportionally
      const avgScale = (scaleX + scaleY) / 2;
      updatedShape.points = shape.points.map((p) => p * avgScale);
    } else if (shape.type === PlacementShapeType.POLYGON && shape.points) {
      // Scale polygon points proportionally
      const avgScale = (scaleX + scaleY) / 2;
      updatedShape.points = shape.points.map((p) => p * avgScale);
    }

    updatedShape.rotation = rotation;
    onShapeTransform(section.id, updatedShape);
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
    const shapeNode = shapeRef.current;
    if (!shapeNode || !isPlacingSections || isSelected) return;

    // Change border color and width on hover - more visible
    const hoverStrokeColor = isHovered ? "#1e40af" : "#3b82f6";
    const hoverStrokeWidth = isHovered ? 2.5 : 2;

    shapeNode.to({
      stroke: hoverStrokeColor,
      strokeWidth: hoverStrokeWidth,
      duration: 0.2,
      easing: Konva.Easings.EaseInOut,
    });
  }, [isHovered, isSelected, isPlacingSections]);

  return (
    <>
      <Group
        ref={groupRef}
        x={x}
        y={y}
        rotation={shape.rotation || 0}
        draggable={isPlacingSections || isSelected}
        onDragEnd={(e) => {
          if (!onSectionDragEnd) return;
          const node = e.target;
          // node.x() and node.y() are already in stage coordinates
          onSectionDragEnd(section.id, node.x(), node.y());
        }}
        onTransformEnd={section.shape ? handleTransformEnd : undefined}
        onMouseDown={(e) => {
          e.cancelBubble = true;
        }}
        onClick={(e) => {
          e.cancelBubble = true;
          const shiftKey = e.evt.shiftKey || false;
          onSectionClick?.(section, { shiftKey });
        }}
        onDblClick={(e) => {
          e.cancelBubble = true;
          onSectionDoubleClick?.(section);
        }}
        onTap={(e: any) => {
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
            <ShapeRenderer
              shape={shape}
              fill="#60a5fa" // Vibrant blue fill
              stroke={isSelected ? "#1e40af" : "#2563eb"}
              strokeWidth={isSelected ? 2.5 : 2}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              opacity={isSelected ? 0.5 : 0.35}
            />
          </Group>
        )}
        {/* Default circle marker when no shape is defined */}
        {!section.shape && (
          <Circle
            radius={isSelected ? 12 : 10}
            fill="rgba(96, 165, 250, 0.35)"
            stroke={isSelected ? "#1e40af" : "#2563eb"}
            strokeWidth={isSelected ? 2.5 : 2}
            x={0}
            y={0}
          />
        )}
      </Group>
      {isSelected && section.shape && (
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
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "top-center",
            "bottom-center",
            "left-center",
            "right-center",
          ]}
        />
      )}
    </>
  );
}

export function LayoutCanvas({
  imageUrl,
  seats,
  sections = [],
  selectedSeatId,
  selectedSectionId,
  isPlacingSeats,
  isPlacingSections,
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
  }, [isPanning, onPanEnd]);

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
      onSeatDragEnd(seatId, x, y);
    },
    [onSeatDragEnd, stageToPercentage]
  );

  // Ensure container dimensions are valid
  const validWidth = containerWidth > 0 ? containerWidth : 800;
  const validHeight = containerHeight > 0 ? containerHeight : 600;

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

  // Calculate image dimensions to fit within container while maintaining aspect ratio
  const imageAspectRatio = image.height / image.width;
  const containerAspectRatio = validHeight / validWidth;

  let displayedWidth: number;
  let displayedHeight: number;

  if (imageAspectRatio > containerAspectRatio) {
    // Image is taller - fit to height
    displayedHeight = validHeight;
    displayedWidth = displayedHeight / imageAspectRatio;
  } else {
    // Image is wider - fit to width
    displayedWidth = validWidth;
    displayedHeight = displayedWidth * imageAspectRatio;
  }

  // Position image centered in container
  const imageX = (validWidth - displayedWidth) / 2;
  const imageY = (validHeight - displayedHeight) / 2;

  // Calculate center point for zoom/pan transforms
  const centerX = validWidth / 2;
  const centerY = validHeight / 2;

  return (
    <Stage
      ref={stageRef}
      width={validWidth}
      height={validHeight}
      onWheel={(e) => onWheel?.(e, isSpacePressed)}
      onMouseDown={(e) => {
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

        // If shape tool is selected, start drawing (drag to draw)
        // For freeform, we use click-to-add-points instead of drag
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

        // For freeform, we don't start drawing on mouseDown - we wait for clicks

        // Pointer tool: Only for selection, don't place seats automatically
        // Seat placement should be done through other UI controls
      }}
      onMouseMove={(e) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;

        if (isPanning && isSpacePressed) {
          const delta = {
            x: pointerPos.x - panStartPos.x,
            y: pointerPos.y - panStartPos.y,
          };

          setPanStartPos(pointerPos);
          onPan?.(delta);
        } else if (
          isDrawingShape &&
          drawStartPos &&
          selectedShapeTool &&
          selectedShapeTool !== PlacementShapeType.FREEFORM
        ) {
          // Update current drawing position for preview (for non-freeform shapes)
          const percentageCoords = pointerToPercentage(
            pointerPos.x,
            pointerPos.y
          );
          setDrawCurrentPos(percentageCoords);
        } else if (
          selectedShapeTool === PlacementShapeType.FREEFORM &&
          freeformPath.length > 0
        ) {
          // Update hover position for freeform preview (show line from last point to cursor)
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
        } else if (
          isDrawingShape &&
          drawStartPos &&
          selectedShapeTool &&
          onShapeDraw
        ) {
          // Prevent click event from propagating to Image onClick handler
          // This prevents creating an extra rectangle when finishing a shape draw
          e.cancelBubble = true;

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
        // Freeform is now handled via click-to-add-points, not mouseLeave
      }}
      style={{
        display: "block",
        cursor:
          isPanning || isSpacePressed
            ? "grab"
            : selectedShapeTool
              ? "crosshair"
              : "pointer", // Pointer tool shows pointer cursor
      }}
    >
      <Layer
        ref={layerRef}
        x={centerX + panOffset.x}
        y={centerY + panOffset.y}
        scaleX={zoomLevel}
        scaleY={zoomLevel}
        offsetX={centerX}
        offsetY={centerY}
      >
        {/* Background Image */}
        <Image
          name="background-image"
          image={image}
          x={imageX}
          y={imageY}
          width={displayedWidth}
          height={displayedHeight}
          listening={true}
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

                  // Calculate distance in pixels for more reliable threshold checking
                  // Convert percentage coordinates to pixel coordinates for distance calculation
                  const lastPixelX = (lastPoint.x / 100) * displayedWidth;
                  const lastPixelY = (lastPoint.y / 100) * displayedHeight;
                  const currentPixelX =
                    (percentageCoords.x / 100) * displayedWidth;
                  const currentPixelY =
                    (percentageCoords.y / 100) * displayedHeight;

                  const distanceInPixels = Math.sqrt(
                    Math.pow(currentPixelX - lastPixelX, 2) +
                      Math.pow(currentPixelY - lastPixelY, 2)
                  );

                  // Use a pixel-based threshold (2 pixels) to prevent exact duplicate clicks
                  // This allows adding points very close together for tight shapes like rectangles/polygons
                  // and works consistently in all directions
                  if (distanceInPixels >= 2) {
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

        {/* Seats */}
        {seats.map((seat) => {
          const { x, y } = percentageToStage(seat.x, seat.y);
          const colors = getSeatColor(seat.seat.seatType);
          const isSelected = selectedSeatId === seat.id;

          return (
            <SeatMarkerComponent
              key={seat.id}
              seat={seat}
              x={x}
              y={y}
              isSelected={isSelected}
              isPlacingSeats={isPlacingSeats}
              isPanning={isPanning}
              isSpacePressed={isSpacePressed}
              isPlacingSections={isPlacingSections}
              onSeatClick={onSeatClick}
              onSeatDragEnd={handleSeatDragEnd}
              onShapeTransform={onSeatShapeTransform}
              colors={colors}
              imageWidth={displayedWidth}
              imageHeight={displayedHeight}
            />
          );
        })}

        {/* Section Markers (for large venue mode) */}
        {venueType === "large" &&
          sections.map((section) => {
            const { x, y } = percentageToStage(section.x, section.y);
            const isSelected = selectedSectionId === section.id;

            return (
              <SectionMarkerComponent
                key={section.id}
                section={section}
                x={x}
                y={y}
                isSelected={isSelected}
                isPlacingSections={isPlacingSections}
                isPanning={isPanning}
                isSpacePressed={isSpacePressed}
                isPlacingSeats={isPlacingSeats}
                onSectionClick={onSectionClick}
                onSectionDoubleClick={onSectionDoubleClick}
                onSectionDragEnd={
                  onSectionDragEnd
                    ? (sectionId: string, stageX: number, stageY: number) => {
                        const { x, y } = stageToPercentage(stageX, stageY);
                        onSectionDragEnd(sectionId, x, y);
                      }
                    : undefined
                }
                onShapeTransform={onSectionShapeTransform}
                imageWidth={displayedWidth}
                imageHeight={displayedHeight}
              />
            );
          })}

        {/* Shape Overlays - clickable areas on the image */}
        {shapeOverlays.map((overlay) => {
          const { x, y } = percentageToStage(overlay.x, overlay.y);
          const isSelected = selectedOverlayId === overlay.id;

          return (
            <Group
              key={overlay.id}
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
                          : "pointer"; // Pointer tool shows pointer cursor
                }
              }}
            >
              <ShapeRenderer
                shape={overlay.shape}
                fill={
                  isSelected
                    ? "rgba(59, 130, 246, 0.25)"
                    : "rgba(59, 130, 246, 0.1)"
                }
                stroke={isSelected ? "#1e40af" : "#3b82f6"}
                strokeWidth={isSelected ? 3 : 2}
                imageWidth={displayedWidth}
                imageHeight={displayedHeight}
                opacity={0.9}
              />
              {overlay.label && (
                <Text
                  text={overlay.label}
                  fontSize={12}
                  fontFamily="Arial"
                  fill="#1e40af"
                  padding={4}
                  align="center"
                  verticalAlign="middle"
                  backgroundFill="rgba(255, 255, 255, 0.95)"
                  backgroundStroke="#3b82f6"
                  backgroundStrokeWidth={1}
                  cornerRadius={2}
                  x={-20}
                  y={-8}
                />
              )}
            </Group>
          );
        })}

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
    </Stage>
  );
}
