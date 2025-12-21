/**
 * Konva-based Canvas Component for Seat Designer
 *
 * Provides better performance and smoother interactions compared to DOM-based rendering
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Image, Circle, Group, Text } from "react-konva";
import Konva from "konva";
import { SeatType } from "../types";

interface SeatMarker {
  id: string;
  x: number;
  y: number;
  seat: {
    section: string;
    row: string;
    seatNumber: string;
    seatType: SeatType;
  };
  isNew?: boolean;
}

interface SectionMarker {
  id: string;
  name: string;
  x: number;
  y: number;
  imageUrl?: string;
  isNew?: boolean;
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
  onSectionClick?: (section: SectionMarker) => void;
  onSectionDoubleClick?: (section: SectionMarker) => void;
  onSeatDragEnd: (seatId: string, newX: number, newY: number) => void;
  onImageClick?: (
    e: Konva.KonvaEventObject<MouseEvent>,
    percentageCoords?: { x: number; y: number }
  ) => void;
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
  onSeatDragEnd,
  onImageClick,
  onWheel,
  onPanStart,
  onPan,
  onPanEnd,
  containerWidth,
  containerHeight,
  venueType,
}: LayoutCanvasProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

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

  // Get seat color based on type
  const getSeatColor = (seatType: SeatType) => {
    switch (seatType) {
      case SeatType.VIP:
        return { fill: "#facc15", stroke: "#ca8a04" }; // yellow
      case SeatType.WHEELCHAIR:
        return { fill: "#4ade80", stroke: "#16a34a" }; // green
      default:
        return { fill: "#d1d5db", stroke: "#6b7280" }; // gray
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

        // Otherwise, handle image click for placement
        const percentageCoords = pointerToPercentage(
          pointerPos.x,
          pointerPos.y
        );
        onImageClick?.(e, percentageCoords);
      }}
      onMouseMove={(e) => {
        if (isPanning && isSpacePressed) {
          const stage = e.target.getStage();
          if (!stage) return;

          const pointerPos = stage.getPointerPosition();
          if (!pointerPos) return;

          const delta = {
            x: pointerPos.x - panStartPos.x,
            y: pointerPos.y - panStartPos.y,
          };

          setPanStartPos(pointerPos);
          onPan?.(delta);
        }
      }}
      onMouseUp={() => {
        if (isPanning) {
          setIsPanning(false);
          onPanEnd?.();
        }
      }}
      onMouseLeave={() => {
        if (isPanning) {
          setIsPanning(false);
          onPanEnd?.();
        }
      }}
      style={{
        display: "block",
        cursor:
          isPanning || isSpacePressed
            ? "grab"
            : isPlacingSeats || isPlacingSections
              ? "crosshair"
              : "default",
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
        />

        {/* Seats */}
        {seats.map((seat) => {
          const { x, y } = percentageToStage(seat.x, seat.y);
          const colors = getSeatColor(seat.seat.seatType);
          const isSelected = selectedSeatId === seat.id;

          return (
            <Group
              key={seat.id}
              x={x}
              y={y}
              draggable={isPlacingSeats}
              onDragEnd={(e) => handleSeatDragEnd(seat.id, e)}
              onMouseDown={(e) => {
                // Prevent event from bubbling to Stage (which would place a new seat)
                e.cancelBubble = true;
              }}
              onClick={(e) => {
                // Select seat when clicked
                e.cancelBubble = true; // Prevent event from bubbling to stage
                onSeatClick?.(seat);
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                onSeatClick?.(seat);
              }}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor = "pointer";
                }
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (container) {
                  container.style.cursor =
                    isPanning || isSpacePressed
                      ? "grab"
                      : isPlacingSeats || isPlacingSections
                        ? "crosshair"
                        : "default";
                }
              }}
            >
              <Circle
                radius={isSelected ? 14 : 12}
                fill={isSelected ? "#3b82f6" : colors.fill}
                stroke={isSelected ? "#1e40af" : colors.stroke}
                strokeWidth={isSelected ? 3 : 2}
                shadowBlur={isSelected ? 10 : 0}
                shadowColor="rgba(0,0,0,0.3)"
              />
              {isSelected && (
                <Circle
                  radius={16}
                  fill="transparent"
                  stroke="#93c5fd"
                  strokeWidth={2}
                />
              )}
            </Group>
          );
        })}

        {/* Section Markers (for large venue mode) */}
        {venueType === "large" &&
          sections.map((section) => {
            const { x, y } = percentageToStage(section.x, section.y);
            const isSelected = selectedSectionId === section.id;

            return (
              <Group
                key={section.id}
                x={x}
                y={y}
                draggable={isPlacingSections}
                onDragEnd={() => {
                  // Handle section drag end if needed
                }}
                onMouseDown={(e) => {
                  // Prevent event from bubbling to Stage (which would place a new section)
                  e.cancelBubble = true;
                }}
                onClick={(e) => {
                  // Select section when clicked
                  e.cancelBubble = true; // Prevent event from bubbling to stage
                  onSectionClick?.(section);
                }}
                onDblClick={(e) => {
                  // Open section detail view when double-clicked
                  e.cancelBubble = true; // Prevent event from bubbling to stage
                  onSectionDoubleClick?.(section);
                }}
                onTap={(e: any) => {
                  e.cancelBubble = true;
                  onSectionClick?.(section);
                }}
                onMouseEnter={(e) => {
                  const container = e.target.getStage()?.container();
                  if (container) {
                    container.style.cursor = "pointer";
                  }
                }}
                onMouseLeave={(e) => {
                  const container = e.target.getStage()?.container();
                  if (container) {
                    container.style.cursor =
                      isPanning || isSpacePressed
                        ? "grab"
                        : isPlacingSeats || isPlacingSections
                          ? "crosshair"
                          : "default";
                  }
                }}
              >
                <Text
                  text={section.name}
                  fontSize={14}
                  fontFamily="Arial"
                  fill={isSelected ? "#ffffff" : "#1e40af"}
                  padding={8}
                  align="center"
                  verticalAlign="middle"
                  backgroundFill={isSelected ? "#3b82f6" : "#ffffff"}
                  backgroundStroke={isSelected ? "#1e40af" : "#3b82f6"}
                  backgroundStrokeWidth={2}
                  cornerRadius={4}
                  x={-30}
                  y={-10}
                />
                {isSelected && (
                  <Circle
                    radius={18}
                    fill="transparent"
                    stroke="#93c5fd"
                    strokeWidth={2}
                    x={0}
                    y={0}
                  />
                )}
              </Group>
            );
          })}
      </Layer>
    </Stage>
  );
}
