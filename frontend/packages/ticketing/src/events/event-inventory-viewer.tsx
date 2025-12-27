/**
 * Event Inventory Viewer Component
 *
 * Displays venue layout with event seats overlaid, showing seat status
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Image, Circle, Group, Text, Rect } from "react-konva";
import Konva from "konva";
import { cn } from "@truths/ui/lib/utils";
import { ZoomControls } from "../seats/seat-designer/components/zoom-controls";
import type { Layout } from "../layouts/types";
import type { Seat } from "../seats/types";
import type { EventSeat, EventSeatStatus } from "./types";
import { EventSeatStatus as EventSeatStatusEnum } from "./types";

export interface EventInventoryViewerProps {
  layout: Layout;
  layoutSeats: Seat[];
  eventSeats: EventSeat[];
  seatStatusMap: Map<string, EventSeat>;
  locationStatusMap: Map<string, EventSeat>;
  imageUrl?: string;
  isLoading?: boolean;
  className?: string;
}

// Get color for seat status
function getSeatStatusColor(status: EventSeatStatus): {
  fill: string;
  stroke: string;
} {
  switch (status) {
    case EventSeatStatusEnum.AVAILABLE:
      return { fill: "#10b981", stroke: "#059669" }; // green
    case EventSeatStatusEnum.RESERVED:
      return { fill: "#f59e0b", stroke: "#d97706" }; // yellow
    case EventSeatStatusEnum.SOLD:
      return { fill: "#3b82f6", stroke: "#2563eb" }; // blue
    case EventSeatStatusEnum.HELD:
      return { fill: "#a855f7", stroke: "#9333ea" }; // purple
    case EventSeatStatusEnum.BLOCKED:
      return { fill: "#ef4444", stroke: "#dc2626" }; // red
    default:
      return { fill: "#9ca3af", stroke: "#6b7280" }; // gray
  }
}

// Convert percentage coordinates to stage coordinates
function percentageToStage(
  x: number,
  y: number,
  stageWidth: number,
  stageHeight: number
) {
  return {
    x: (x / 100) * stageWidth,
    y: (y / 100) * stageHeight,
  };
}

interface SeatMarkerProps {
  seat: Seat;
  eventSeat?: EventSeat;
  x: number;
  y: number;
  isHovered: boolean;
  isSpacePressed: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

function SeatMarker({
  seat,
  eventSeat,
  x,
  y,
  isHovered,
  isSpacePressed,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: SeatMarkerProps) {
  const colors = eventSeat
    ? getSeatStatusColor(eventSeat.status)
    : { fill: "#9ca3af", stroke: "#6b7280" };

  const radius = isHovered ? 8 : 6;

  // Build tooltip text with seat details
  const tooltipText = eventSeat
    ? `${seat.section_name || ""} ${seat.row} ${seat.seat_number}\nStatus: ${eventSeat.status}\nPrice: $${eventSeat.price.toFixed(2)}`
    : `${seat.section_name || ""} ${seat.row} ${seat.seat_number}\nNo event seat`;

  return (
    <Group
      x={x}
      y={y}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = "pointer";
        }
        onMouseEnter();
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor =
            isSpacePressed ? "grabbing" : "default";
        }
        onMouseLeave();
      }}
      onClick={(e) => {
        e.cancelBubble = true;
        onClick();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onClick();
      }}
      onMouseDown={(e) => {
        e.cancelBubble = true;
      }}
    >
      <Circle
        radius={radius}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={isHovered ? 3 : 1}
        opacity={isHovered ? 1 : 0.8}
      />
      {isHovered && (
        <Group>
          <Rect
            x={-60}
            y={radius + 5}
            width={120}
            height={eventSeat ? 50 : 20}
            fill="rgba(0, 0, 0, 0.8)"
            cornerRadius={4}
          />
          <Text
            text={tooltipText}
            fontSize={11}
            fill="#fff"
            y={radius + 10}
            x={-55}
            width={110}
            align="left"
            padding={4}
            lineHeight={1.4}
          />
        </Group>
      )}
    </Group>
  );
}

export function EventInventoryViewer({
  layout,
  layoutSeats,
  eventSeats,
  seatStatusMap,
  locationStatusMap,
  imageUrl,
  isLoading = false,
  className,
}: EventInventoryViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPos, setPanStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load image
  useEffect(() => {
    if (!imageUrl) {
      setImage(null);
      setImageLoaded(false);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      setImageLoaded(true);
    };
    img.onerror = () => {
      setImage(null);
      setImageLoaded(false);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Update container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Handle Space key for panning (same as seat designer)
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
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPanning]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev * 1.2, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>, isSpacePressed: boolean) => {
      // Only zoom if Space key is held (same as seat designer)
      if (!isSpacePressed) {
        return; // Allow normal scrolling if Space is not pressed
      }

      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Calculate center point (needed for Layer offset)
      const validWidth = containerSize.width > 0 ? containerSize.width : 800;
      const validHeight = containerSize.height > 0 ? containerSize.height : 600;
      const centerX = validWidth / 2;
      const centerY = validHeight / 2;

      const scaleBy = 1.1;
      const oldScale = zoomLevel;
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      // Convert pointer position to Layer coordinates
      // Layer transform: stageX = (lx - centerX) * zoomLevel + (centerX + panOffset.x)
      // Reverse: lx = (stageX - (centerX + panOffset.x)) / zoomLevel + centerX
      const layerX = (pointer.x - (centerX + panOffset.x)) / oldScale + centerX;
      const layerY = (pointer.y - (centerY + panOffset.y)) / oldScale + centerY;

      // Calculate new pan offset so the point at (layerX, layerY) stays at pointer position
      // stageX = (layerX - centerX) * newScale + (centerX + newPanX)
      // newPanX = stageX - centerX - (layerX - centerX) * newScale
      const newPanX = pointer.x - centerX - (layerX - centerX) * clampedScale;
      const newPanY = pointer.y - centerY - (layerY - centerY) * clampedScale;

      setZoomLevel(clampedScale);
      setPanOffset({
        x: newPanX,
        y: newPanY,
      });
    },
    [zoomLevel, panOffset, containerSize]
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      // If Space is pressed, start panning
      if (isSpacePressed) {
        setIsPanning(true);
        setPanStartPos(pointerPos);
        return;
      }
    },
    [isSpacePressed]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isPanning && isSpacePressed) {
        const stage = e.target.getStage();
        if (!stage) return;

        const pointerPos = stage.getPointerPosition();
        if (!pointerPos || !panStartPos) return;

        const delta = {
          x: pointerPos.x - panStartPos.x,
          y: pointerPos.y - panStartPos.y,
        };

        setPanStartPos(pointerPos);
        setPanOffset((prev) => ({
          x: prev.x + delta.x,
          y: prev.y + delta.y,
        }));
      }
    },
    [isPanning, isSpacePressed, panStartPos]
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setPanStartPos(null);
    }
  }, [isPanning]);

  const handleMouseLeave = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setPanStartPos(null);
    }
  }, [isPanning]);

  // Ensure container dimensions are valid (same as layout designer)
  const validWidth = containerSize.width > 0 ? containerSize.width : 800;
  const validHeight = containerSize.height > 0 ? containerSize.height : 600;

  // Convert percentage coordinates to Konva stage coordinates
  // Since Layer has offsetX/offsetY set to center, coordinates are relative to Layer's centered origin
  // This matches the layout designer exactly
  const percentageToStage = useCallback(
    (xPercent: number, yPercent: number) => {
      if (!image) return { x: 0, y: 0 };

      const currentValidWidth = containerSize.width > 0 ? containerSize.width : 800;
      const currentValidHeight = containerSize.height > 0 ? containerSize.height : 600;

      const imageAspectRatio = image.height / image.width;
      const containerAspectRatio = currentValidHeight / currentValidWidth;

      let displayedWidth: number;
      let displayedHeight: number;

      if (imageAspectRatio > containerAspectRatio) {
        displayedHeight = currentValidHeight;
        displayedWidth = displayedHeight / imageAspectRatio;
      } else {
        displayedWidth = currentValidWidth;
        displayedHeight = displayedWidth * imageAspectRatio;
      }

      // Image is positioned centered in container
      const imageX = (currentValidWidth - displayedWidth) / 2;
      const imageY = (currentValidHeight - displayedHeight) / 2;

      const x = imageX + (xPercent / 100) * displayedWidth;
      const y = imageY + (yPercent / 100) * displayedHeight;

      return { x, y };
    },
    [image, containerSize]
  );

  // Show loading indicator while image is loading or image dimensions are invalid
  if (isLoading || !image || !imageLoaded || !image.width || !image.height) {
    return (
      <div
        className={cn("relative border rounded-lg overflow-hidden bg-gray-100", className)}
        ref={containerRef}
      >
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
          <div className="text-muted-foreground">Loading seats...</div>
        </div>
      </div>
    );
  }

  // Calculate image dimensions to fit within container while maintaining aspect ratio
  // Use the same logic as layout designer
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
    <div className={cn("relative border rounded-lg overflow-hidden bg-gray-100", className)}>
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ minHeight: "600px", height: "70vh" }}
      >
        <Stage
          ref={stageRef}
          width={validWidth}
          height={validHeight}
          onWheel={(e) => handleWheel(e, isSpacePressed)}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            display: "block",
            cursor:
              hoveredSeatId
                ? "pointer"
                : isPanning || isSpacePressed
                  ? "grabbing"
                  : "default",
          }}
        >
          <Layer
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
            {layoutSeats.map((seat) => {
              if (!seat.x_coordinate || !seat.y_coordinate) return null;

                // Convert percentage coordinates to stage coordinates using same logic as layout designer
                const { x, y } = percentageToStage(seat.x_coordinate, seat.y_coordinate);

                // Find event seat by seat_id or location
                let eventSeat: EventSeat | undefined;
                if (seat.id && seatStatusMap.has(seat.id)) {
                  eventSeat = seatStatusMap.get(seat.id);
                } else if (
                  seat.section_name &&
                  seat.row &&
                  seat.seat_number
                ) {
                  const key = `${seat.section_name}|${seat.row}|${seat.seat_number}`;
                  eventSeat = locationStatusMap.get(key);
                }

                return (
                  <SeatMarker
                    key={seat.id}
                    seat={seat}
                    eventSeat={eventSeat}
                    x={x}
                    y={y}
                    isHovered={hoveredSeatId === seat.id}
                    isSpacePressed={isSpacePressed}
                    onMouseEnter={() => setHoveredSeatId(seat.id)}
                    onMouseLeave={() => setHoveredSeatId(null)}
                    onClick={() => {
                      // TODO: Open seat detail/edit dialog
                      console.log("Seat clicked:", seat, eventSeat);
                    }}
                  />
                );
              })}
            </Layer>
          </Stage>
      </div>

      {/* Zoom Controls */}
      <ZoomControls
        zoomLevel={zoomLevel}
        panOffset={panOffset}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
        <div className="text-xs font-medium mb-2">Seat Status</div>
        <div className="space-y-1">
          {Object.entries(EventSeatStatusEnum).map(([key, value]) => {
            const colors = getSeatStatusColor(value);
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors.fill, border: `1px solid ${colors.stroke}` }}
                />
                <span>{key}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

