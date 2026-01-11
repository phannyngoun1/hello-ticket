/**
 * Event Inventory Viewer Component
 *
 * Displays venue layout with event seats overlaid, showing seat status
 */

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Stage, Layer, Image, Circle, Group, Text, Rect, Ellipse, Line } from "react-konva";
import Konva from "konva";
import { createPortal } from "react-dom";
import { cn } from "@truths/ui/lib/utils";
import { toast } from "@truths/ui";
import { ArrowLeft, Lock, Pause, Ban, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { ZoomControls } from "../seats/seat-designer/components/zoom-controls";
import type { Layout } from "../layouts/types";
import type { Section } from "../layouts/types";
import type { Seat } from "../seats/types";
import type { EventSeat, EventSeatStatus } from "./types";
import { EventSeatStatus as EventSeatStatusEnum } from "./types";
import { PlacementShapeType, type PlacementShape } from "../seats/seat-designer/types";

export interface EventInventoryViewerProps {
  layout: Layout;
  layoutSeats: Seat[];
  sections: Section[];
  eventSeats: EventSeat[];
  seatStatusMap: Map<string, EventSeat>;
  locationStatusMap: Map<string, EventSeat>;
  imageUrl?: string;
  isLoading?: boolean;
  className?: string;
  onSeatClick?: (seatId: string, eventSeat?: EventSeat) => void;
  selectedSeatIds?: Set<string>;
  selectedSectionId?: string | null;
  onSelectedSectionIdChange?: (sectionId: string | null) => void;
}

// Get color for ticket status (takes priority over event-seat status)
function getTicketStatusColor(ticketStatus?: string): {
  fill: string;
  stroke: string;
} | null {
  if (!ticketStatus) return null;

  // Normalize status - handle both enum values and string values
  const statusUpper = String(ticketStatus).toUpperCase().trim();
  switch (statusUpper) {
    case "AVAILABLE":
      return { fill: "#10b981", stroke: "#059669" }; // green
    case "RESERVED":
      return { fill: "#f59e0b", stroke: "#d97706" }; // yellow/orange
    case "CONFIRMED":
      return { fill: "#3b82f6", stroke: "#2563eb" }; // blue
    case "CANCELLED":
      return { fill: "#ef4444", stroke: "#dc2626" }; // red
    case "USED":
      return { fill: "#6b7280", stroke: "#4b5563" }; // gray
    case "TRANSFERRED":
      return { fill: "#a855f7", stroke: "#9333ea" }; // purple
    default:
      // If ticket status doesn't match, return null to fall back to event-seat status
      return null;
  }
}

// Get color for seat status
function getSeatStatusColor(status: EventSeatStatus): {
  fill: string;
  stroke: string;
} {
  // Normalize status to handle both enum values and string values
  const statusUpper = String(status).toUpperCase().trim();

  switch (statusUpper) {
    case "AVAILABLE":
      return { fill: "#10b981", stroke: "#059669" }; // green
    case "RESERVED":
      return { fill: "#f59e0b", stroke: "#d97706" }; // yellow
    case "SOLD":
      return { fill: "#3b82f6", stroke: "#2563eb" }; // blue
    case "HELD":
      return { fill: "#a855f7", stroke: "#9333ea" }; // purple
    case "BLOCKED":
      return { fill: "#ef4444", stroke: "#dc2626" }; // red
    default:
      return { fill: "#9ca3af", stroke: "#6b7280" }; // gray
  }
}

// Get transparency overlay for seat status
function getSeatStatusTransparency(status: EventSeatStatus): number {
  // Normalize status to handle both enum values and string values
  const statusUpper = String(status).toUpperCase().trim();

  switch (statusUpper) {
    case "AVAILABLE":
      return 0.4; // Light transparency for available seats
    case "SOLD":
      return 0.7; // High transparency for sold seats
    case "HELD":
      return 0.6; // Medium-high transparency for held seats
    case "BLOCKED":
      return 0.8; // Very high transparency for blocked seats
    case "RESERVED":
      return 0.5; // Medium transparency for reserved seats
    default:
      return 0.3; // Default medium transparency
  }
}

interface SeatMarkerProps {
  seat: Seat;
  eventSeat?: EventSeat;
  x: number;
  y: number;
  isHovered: boolean;
  isSpacePressed: boolean;
  isSelected?: boolean;
  onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

interface SectionMarkerProps {
  section: Section;
  x: number;
  y: number;
  isHovered: boolean;
  isSpacePressed: boolean;
  totalSeats: number;
  eventSeatCount: number;
  statusCounts: Record<string, number>;
  imageWidth: number;
  imageHeight: number;
  onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

// Helper function to parse shape from JSON string
function parseShape(shapeString?: string | null): PlacementShape | undefined {
  if (!shapeString) return undefined;
  try {
    const parsed = JSON.parse(shapeString);
    if (parsed && typeof parsed === 'object' && parsed.type) {
      const shape = {
        ...parsed,
        type: parsed.type as PlacementShapeType,
      };
      // Validate that the type is a valid PlacementShapeType
      if (Object.values(PlacementShapeType).includes(shape.type)) {
        return shape;
      } else {
        console.warn("Invalid shape type:", shape.type);
        return undefined;
      }
    }
  } catch (e) {
    console.error("Failed to parse shape:", e, "Shape string:", shapeString);
  }
  return undefined;
}

// Helper function to render shape based on PlacementShape
function renderShape(
  shape: PlacementShape | undefined,
  colors: { fill: string; stroke: string },
  imageWidth: number,
  imageHeight: number,
  strokeWidth: number = 2.5,
  opacity: number = 1
) {
  // Make fill completely transparent by default - convert hex to rgba with 0 opacity
  // Fill will only be visible when the Group opacity is > 0 (on hover/selection)
  const getTransparentFill = (color: string): string => {
    if (color.startsWith('rgba')) return color;
    if (color.startsWith('#')) {
      // Convert hex to rgba with 0 opacity - completely transparent
      // The Group opacity will control visibility
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, 0)`;
    }
    return color;
  };

  const baseProps = {
    fill: getTransparentFill(colors.fill),
    stroke: colors.stroke,
    strokeWidth,
    opacity,
  };

  // Default to circle if no shape - match designer default
  if (!shape) {
    const defaultRadius = 12; // Match designer default
    return <Circle {...baseProps} radius={defaultRadius} />;
  }

  switch (shape.type) {
    case PlacementShapeType.CIRCLE: {
      // Match designer: use Math.min(imageWidth, imageHeight) for circle radius
      const radius = shape.radius
        ? (shape.radius / 100) * Math.min(imageWidth, imageHeight)
        : 12; // Match designer default
      const validRadius = Math.max(1, Math.abs(radius));
      return <Circle {...baseProps} radius={validRadius} rotation={shape.rotation || 0} />;
    }

    case PlacementShapeType.RECTANGLE: {
      // Match designer: use imageWidth and imageHeight directly
      const width = shape.width ? (shape.width / 100) * imageWidth : 24; // Match designer default
      const height = shape.height ? (shape.height / 100) * imageHeight : 24; // Match designer default
      const validWidth = Math.max(1, Math.abs(width));
      const validHeight = Math.max(1, Math.abs(height));
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
          rotation={shape.rotation || 0}
        />
      );
    }

    case PlacementShapeType.ELLIPSE: {
      // Match designer: divide by 2 for radiusX and radiusY
      const radiusX = shape.width ? ((shape.width / 100) * imageWidth) / 2 : 12; // Match designer default
      const radiusY = shape.height
        ? ((shape.height / 100) * imageHeight) / 2
        : 12; // Match designer default
      const validRadiusX = Math.max(1, Math.abs(radiusX));
      const validRadiusY = Math.max(1, Math.abs(radiusY));
      return (
        <Ellipse
          {...baseProps}
          radiusX={validRadiusX}
          radiusY={validRadiusY}
          rotation={shape.rotation || 0}
        />
      );
    }

    case PlacementShapeType.POLYGON: {
      // Match designer: need at least 6 points (3 vertices) for polygon
      if (!shape.points || shape.points.length < 6) {
        const radius = 12; // Match designer default
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
      // Match designer: need at least 4 points (2 vertices) for freeform
      if (!shape.points || shape.points.length < 4) {
        const radius = 12; // Match designer default
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
      // Use straight lines (no tension) for polygon drawing - match designer
      return <Line {...baseProps} points={points} closed={true} tension={0} />;
    }

    default:
      // Match designer default
      return <Circle {...baseProps} radius={12} />;
  }
}

function SeatMarker({
  seat,
  eventSeat,
  x,
  y,
  isHovered,
  isSpacePressed,
  isSelected = false,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onClick,
  imageWidth,
  imageHeight,
}: SeatMarkerProps & { imageWidth: number; imageHeight: number }) {
  const shapeGroupRef = useRef<Konva.Group>(null);
  const [isHoveredState, setIsHoveredState] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  // Get colors based on ticket status first (takes priority), then event-seat status
  let statusColors: { fill: string; stroke: string };

  // Check ticket status first (takes priority)
  if (eventSeat?.ticket_status) {
    const ticketColors = getTicketStatusColor(eventSeat.ticket_status);
    if (ticketColors) {
      statusColors = ticketColors;
    } else {
      // Ticket status exists but doesn't match known values, fall back to event-seat status
      statusColors = getSeatStatusColor(eventSeat.status);
    }
  } else if (eventSeat) {
    // No ticket status, use event-seat status
    statusColors = getSeatStatusColor(eventSeat.status);
  } else {
    // No event seat - use gray
    statusColors = { fill: "#9ca3af", stroke: "#6b7280" };
  }

  // Use a lighter version of the status color for fill, and darker for border
  // This ensures the status is visible even if borders are hard to see
  // If selected, use a different color (cyan/teal) to indicate selection (distinct from sold/blue)
  const fillColor = isSelected ? "#06b6d4" : statusColors.fill;
  const borderColor = isSelected ? "#0891b2" : statusColors.stroke;

  // Check if seat is available for selection
  const isAvailableForSelection = eventSeat?.status === "available";

  // Calculate opacity and stroke based on state
  // Always visible with thicker stroke, enhanced on hover/selection
  const baseOpacity = 0.3; // Always visible with thicker stroke
  const hoverOpacity = isAvailableForSelection ? 0.8 : 0.5; // Available seats more visible on hover
  const selectedOpacity = 0.95; // Fully visible when selected

  const currentOpacity = isSelected
    ? selectedOpacity
    : (isHovered || isHoveredState)
      ? hoverOpacity
      : baseOpacity;

  const strokeWidth = isSelected
    ? 4
    : (isHovered || isHoveredState)
      ? 3
      : 2; // Always visible thicker stroke

  // Parse shape from seat
  const parsedShape = parseShape(seat.shape);

  // Animate opacity and stroke on hover/selection change
  useEffect(() => {
    const shapeGroup = shapeGroupRef.current;
    if (!shapeGroup) return;

    shapeGroup.to({
      opacity: currentOpacity,
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
        });
      }
    });
  }, [currentOpacity, strokeWidth]);

  // Click feedback animation
  useEffect(() => {
    if (!isClicked) return;
    
    const shapeGroup = shapeGroupRef.current;
    if (!shapeGroup) return;

    // Scale down and back up for click feedback
    shapeGroup.scaleX(0.9);
    shapeGroup.scaleY(0.9);
    
    shapeGroup.to({
      scaleX: 1,
      scaleY: 1,
      duration: 0.15,
      easing: Konva.Easings.EaseOut,
      onFinish: () => {
        setIsClicked(false);
      },
    });
  }, [isClicked]);

  // Get status transparency
  const statusTransparency = eventSeat ? getSeatStatusTransparency(eventSeat.status) : 0;

  return (
    <Group
      x={x}
      y={y}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = isAvailableForSelection ? "pointer" : "not-allowed";
        }
        setIsHoveredState(true);
        onMouseEnter(e);
      }}
      onMouseMove={(e) => {
        if (onMouseMove) {
          onMouseMove(e);
        }
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = isSpacePressed ? "grabbing" : "default";
        }
        setIsHoveredState(false);
        onMouseLeave();
      }}
      onClick={(e) => {
        e.cancelBubble = true;
        setIsClicked(true);
        onClick();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        setIsClicked(true);
        onClick();
      }}
      onMouseDown={(e) => {
        e.cancelBubble = true;
      }}
    >
      {/* Status color overlay - shows when seat is visible */}
      {(currentOpacity > 0 || isSelected) && eventSeat && (
        <Group opacity={statusTransparency * currentOpacity}>
          {renderShape(
            parsedShape,
            { fill: fillColor, stroke: "transparent" },
            imageWidth,
            imageHeight,
            0, // No stroke width
            1 // Group opacity handles overall transparency
          )}
        </Group>
      )}

      <Group ref={shapeGroupRef} opacity={currentOpacity}>
        {renderShape(
          parsedShape,
          { fill: fillColor, stroke: borderColor },
          imageWidth,
          imageHeight,
          strokeWidth,
          1 // Group opacity handles overall transparency
        )}
      </Group>

      {/* Removed inline tooltip - using Popover instead */}
    </Group>
  );
}

function SectionMarker({
  section,
  x,
  y,
  isHovered,
  isSpacePressed,
  eventSeatCount,
  statusCounts,
  imageWidth,
  imageHeight,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onClick,
}: SectionMarkerProps) {
  const groupRef = useRef<Konva.Group>(null);
  const shapeGroupRef = useRef<Konva.Group>(null);
  const textRef = useRef<Konva.Text>(null);
  const [isHoveredState, setIsHoveredState] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  // Determine section status color based on event seats
  // Priority: SOLD > RESERVED > HELD > BLOCKED > AVAILABLE
  let statusColor = { fill: "#9ca3af", stroke: "#6b7280" }; // gray (no event seats)
  if (eventSeatCount > 0) {
    if (statusCounts["sold"] > 0) {
      statusColor = { fill: "#3b82f6", stroke: "#2563eb" }; // blue
    } else if (statusCounts["reserved"] > 0) {
      statusColor = { fill: "#f59e0b", stroke: "#d97706" }; // yellow
    } else if (statusCounts["held"] > 0) {
      statusColor = { fill: "#a855f7", stroke: "#9333ea" }; // purple
    } else if (statusCounts["blocked"] > 0) {
      statusColor = { fill: "#ef4444", stroke: "#dc2626" }; // red
    } else if (statusCounts["available"] > 0) {
      statusColor = { fill: "#10b981", stroke: "#059669" }; // green
    }
  }

  // Parse shape from section
  const parsedShape = parseShape(section.shape);
  const hasShape = !!parsedShape;

  // Calculate opacity and stroke based on state
  // Completely transparent by default, only visible on hover to show interactivity
  const baseOpacity = 0; // Completely transparent - invisible until hovered
  const hoverOpacity = 0.65; // Visible on hover to show it's interactive
  const currentOpacity = (isHovered || isHoveredState)
    ? hoverOpacity 
    : baseOpacity;
  
  const strokeWidth = (isHovered || isHoveredState) ? 2.5 : 0; // No stroke by default when invisible

  // Animate opacity and stroke on hover change
  useEffect(() => {
    const shapeGroup = shapeGroupRef.current;
    if (!shapeGroup || !hasShape) return;

    shapeGroup.to({
      opacity: currentOpacity,
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
        });
      }
    });
  }, [currentOpacity, strokeWidth, hasShape]);

  // Animate text label on hover
  useEffect(() => {
    const text = textRef.current;
    if (!text || hasShape) return;

    text.to({
      fontSize: (isHovered || isHoveredState) ? 15 : 14,
      shadowBlur: (isHovered || isHoveredState) ? 4 : 2,
      backgroundStrokeWidth: strokeWidth,
      duration: 0.2,
      easing: Konva.Easings.EaseInOut,
    });
  }, [isHovered, isHoveredState, strokeWidth, hasShape]);

  // Click feedback animation
  useEffect(() => {
    if (!isClicked) return;
    
    const group = groupRef.current;
    if (!group) return;

    // Scale down and back up for click feedback
    group.scaleX(0.9);
    group.scaleY(0.9);
    
    group.to({
      scaleX: 1,
      scaleY: 1,
      duration: 0.15,
      easing: Konva.Easings.EaseOut,
      onFinish: () => {
        setIsClicked(false);
      },
    });
  }, [isClicked]);

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      rotation={parsedShape?.rotation || 0}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = "pointer";
        }
        setIsHoveredState(true);
        onMouseEnter(e);
      }}
      onMouseMove={(e) => {
        if (onMouseMove) {
          onMouseMove(e);
        }
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = isSpacePressed ? "grabbing" : "default";
        }
        setIsHoveredState(false);
        onMouseLeave();
      }}
      onClick={(e) => {
        e.cancelBubble = true;
        setIsClicked(true);
        onClick();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        setIsClicked(true);
        onClick();
      }}
      onMouseDown={(e) => {
        e.cancelBubble = true;
      }}
    >
      {/* Render shape if available */}
      {hasShape ? (
        <Group ref={shapeGroupRef} opacity={currentOpacity}>
          {renderShape(
            parsedShape,
            { fill: statusColor.fill, stroke: statusColor.stroke },
            imageWidth,
            imageHeight,
            strokeWidth,
            1 // Group opacity handles overall transparency
          )}
        </Group>
      ) : (
        // Fallback to text label if no shape - also transparent by default
        <Text
          ref={textRef}
          text={section.name}
          fontSize={14}
          fontFamily="Arial"
          fill={isHovered || isHoveredState ? "#1e3a8a" : "#1e40af"}
          padding={8}
          align="center"
          verticalAlign="middle"
          backgroundFill={statusColor.fill}
          backgroundStroke={statusColor.stroke}
          backgroundStrokeWidth={strokeWidth}
          cornerRadius={4}
          x={-30}
          y={-10}
          shadowBlur={2}
          shadowColor="rgba(0,0,0,0.2)"
          opacity={currentOpacity}
        />
      )}
    </Group>
  );
}

export function EventInventoryViewer({
  layout,
  layoutSeats,
  sections,
  seatStatusMap,
  locationStatusMap,
  imageUrl,
  isLoading = false,
  className,
  onSeatClick,
  selectedSeatIds = new Set(),
  selectedSectionId: controlledSelectedSectionId,
  onSelectedSectionIdChange,
}: EventInventoryViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 600,
  });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPos, setPanStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);
  const [hoveredSeatPosition, setHoveredSeatPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hoveredSeatData, setHoveredSeatData] = useState<{
    seat: Seat;
    eventSeat?: EventSeat;
  } | null>(null);
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  const [hoveredSectionData, setHoveredSectionData] = useState<{
    section: Section;
    seatCount: number;
    eventSeatCount: number;
    statusSummary: Record<string, number>;
  } | null>(null);
  // Use controlled state if provided, otherwise use internal state
  const [internalSelectedSectionId, setInternalSelectedSectionId] = useState<string | null>(
    null
  );
  const selectedSectionId = controlledSelectedSectionId !== undefined 
    ? controlledSelectedSectionId 
    : internalSelectedSectionId;
  const setSelectedSectionId = onSelectedSectionIdChange 
    ? onSelectedSectionIdChange 
    : setInternalSelectedSectionId;
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Create section name map for location-based matching
  const sectionNameMap = useMemo(() => {
    const map = new Map<string, string>();
    sections.forEach((section) => {
      map.set(section.id, section.name);
    });
    return map;
  }, [sections]);

  // Calculate section statistics for section-level layouts
  const sectionStats = useMemo(() => {
    if (layout.design_mode !== "section-level") return new Map();

    const stats = new Map<
      string,
      {
        section: Section;
        totalSeats: number;
        eventSeats: EventSeat[];
        statusCounts: Record<string, number>;
        eventSeatCount: number;
      }
    >();

    sections.forEach((section) => {
      // Get all seats in this section
      const sectionSeats = layoutSeats.filter(
        (seat) => seat.section_id === section.id
      );

      // Get all event seats for this section
      const sectionEventSeats: EventSeat[] = [];
      sectionSeats.forEach((seat) => {
        // Try by seat_id
        if (seat.id && seatStatusMap.has(seat.id)) {
          sectionEventSeats.push(seatStatusMap.get(seat.id)!);
        } else if (seat.row && seat.seat_number) {
          // Try by location
          const sectionName = section.name;
          const key = `${sectionName}|${seat.row}|${seat.seat_number}`;
          const eventSeat = locationStatusMap.get(key);
          if (eventSeat) {
            sectionEventSeats.push(eventSeat);
          }
        }
      });

      // Count statuses
      const statusCounts: Record<string, number> = {};
      
      // Initialize all statuses to 0
      Object.values(EventSeatStatusEnum).forEach((status) => {
        statusCounts[status] = 0;
      });

      sectionEventSeats.forEach((eventSeat) => {
        const status = eventSeat.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      stats.set(section.id, {
        section,
        totalSeats: sectionSeats.length,
        eventSeats: sectionEventSeats,
        statusCounts,
        eventSeatCount: sectionEventSeats.length,
      });
    });

    return stats;
  }, [
    layout.design_mode,
    sections,
    layoutSeats,
    seatStatusMap,
    locationStatusMap,
    sectionNameMap,
  ]);

  // Get selected section for drill-down
  const selectedSection = useMemo(() => {
    if (!selectedSectionId) return null;
    return sections.find((s) => s.id === selectedSectionId) || null;
  }, [selectedSectionId, sections]);

  // Get image URL - use section image if in drill-down mode, otherwise use layout image
  const displayImageUrl = useMemo(() => {
    if (selectedSection?.image_url) {
      return selectedSection.image_url;
    }
    return imageUrl;
  }, [selectedSection, imageUrl]);

  // Filter seats by selected section when in drill-down mode
  const displayedSeats = useMemo(() => {
    if (layout.design_mode === "section-level" && selectedSectionId) {
      return layoutSeats.filter(
        (seat) => seat.section_id === selectedSectionId
      );
    }
    return layoutSeats;
  }, [layout.design_mode, selectedSectionId, layoutSeats]);

  // Load image
  useEffect(() => {
    if (!displayImageUrl) {
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
    img.src = displayImageUrl;
  }, [displayImageUrl]);

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

  const handleBackToSections = useCallback(() => {
    if (onSelectedSectionIdChange) {
      onSelectedSectionIdChange(null);
    } else {
      setInternalSelectedSectionId(null);
    }
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [onSelectedSectionIdChange]);

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
      const newScale =
        e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
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

  // Helper function to calculate and update popover position
  const updatePopoverPosition = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const group = e.target.getParent();
      const evt = e.evt;
      const stage = e.target.getStage();

      if (group && stage && containerRef.current) {
        try {
          // Get the container's bounding rect to account for its position on the page
          const containerRect = containerRef.current.getBoundingClientRect();

          // Use Konva's getClientRect to get the bounding box
          // This gives us coordinates relative to the stage container
          const box = group.getClientRect();

          // Convert to absolute screen coordinates by adding container position
          // This accounts for scroll position since getBoundingClientRect() is relative to viewport
          const absoluteX = containerRect.left + box.x;
          const absoluteY = containerRect.top + box.y;

          const popoverWidth = 320; // Width of the popover
          const popoverHeight = 200; // Estimated height
          const offset = 15; // Offset from seat

          // Calculate preferred position (to the right of seat)
          let screenX = absoluteX + box.width + offset;
          let screenY = absoluteY + box.height / 2 - popoverHeight / 2;

          // Get viewport dimensions
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          // Check if popover would go off right edge of viewport
          if (screenX + popoverWidth > viewportWidth) {
            // Position to the left of seat instead
            screenX = absoluteX - popoverWidth - offset;
          }

          // Check if popover would go off left edge
          if (screenX < 0) {
            screenX = Math.max(offset, absoluteX + box.width + offset);
            // If still off screen, position at edge
            if (screenX + popoverWidth > viewportWidth) {
              screenX = viewportWidth - popoverWidth - offset;
            }
          }

          // Check if popover would go off bottom edge
          if (screenY + popoverHeight > viewportHeight) {
            screenY = viewportHeight - popoverHeight - offset;
          }

          // Check if popover would go off top edge
          if (screenY < 0) {
            screenY = offset;
          }

          setHoveredSeatPosition({ x: screenX, y: screenY });
        } catch (error) {
          // Fallback to mouse position if getClientRect fails
          const popoverWidth = 320;
          let screenX = evt.clientX + 20;
          let screenY = evt.clientY - 100;

          // Keep on screen
          if (screenX + popoverWidth > window.innerWidth) {
            screenX = evt.clientX - popoverWidth - 20;
          }
          if (screenY < 0) {
            screenY = 10;
          }

          setHoveredSeatPosition({ x: screenX, y: screenY });
        }
      } else {
        // Fallback to mouse position
        const popoverWidth = 320;
        let screenX = evt.clientX + 20;
        let screenY = evt.clientY - 100;

        // Keep on screen
        if (screenX + popoverWidth > window.innerWidth) {
          screenX = evt.clientX - popoverWidth - 20;
        }
        if (screenY < 0) {
          screenY = 10;
        }

        setHoveredSeatPosition({ x: screenX, y: screenY });
      }
    },
    []
  );

  // Ensure container dimensions are valid (same as layout designer)
  const validWidth = containerSize.width > 0 ? containerSize.width : 800;
  const validHeight = containerSize.height > 0 ? containerSize.height : 600;

  // Convert percentage coordinates to Konva stage coordinates
  // Since Layer has offsetX/offsetY set to center, coordinates are relative to Layer's centered origin
  // This matches the layout designer exactly
  const percentageToStage = useCallback(
    (xPercent: number, yPercent: number) => {
      if (!image) return { x: 0, y: 0 };

      const currentValidWidth =
        containerSize.width > 0 ? containerSize.width : 800;
      const currentValidHeight =
        containerSize.height > 0 ? containerSize.height : 600;

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
        className={cn(
          "relative border rounded-lg overflow-hidden bg-gray-100",
          className
        )}
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
    <div
      className={cn(
        "relative border rounded-lg overflow-hidden bg-gray-100",
        className
      )}
    >
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
            cursor: hoveredSeatId
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

            {/* Render sections for section-level layouts, seats for seat-level layouts */}
            {layout.design_mode === "section-level" && !selectedSectionId
              ? // Section-level: Display sections (when not in drill-down mode)
                sections.map((section) => {
                  const stats = sectionStats.get(section.id);
                  if (!stats) return null;

                  // Use section coordinates if available, otherwise skip
                  if (!section.x_coordinate || !section.y_coordinate)
                    return null;

                  const { x, y } = percentageToStage(
                    section.x_coordinate,
                    section.y_coordinate
                  );

                  return (
                    <SectionMarker
                      key={section.id}
                      section={section}
                      x={x}
                      y={y}
                      isHovered={hoveredSectionId === section.id}
                      isSpacePressed={isSpacePressed}
                      totalSeats={stats.totalSeats}
                      eventSeatCount={stats.eventSeatCount}
                      statusCounts={stats.statusCounts}
                      imageWidth={displayedWidth}
                      imageHeight={displayedHeight}
                      onMouseEnter={(e) => {
                        setHoveredSectionId(section.id);
                        setHoveredSectionData({
                          section,
                          seatCount: stats.totalSeats,
                          eventSeatCount: stats.eventSeats.length,
                          statusSummary: stats.statusCounts,
                        });
                        updatePopoverPosition(e);
                      }}
                      onMouseMove={updatePopoverPosition}
                      onMouseLeave={() => {
                        setHoveredSectionId(null);
                        setHoveredSeatPosition(null);
                        setHoveredSectionData(null);
                      }}
                      onClick={() => {
                        // Check if section has seats before drilling down
                        if (stats.totalSeats === 0) {
                          toast({
                            title: "No Seats Available",
                            description: `Section "${section.name}" does not have any seats. Please add seats to this section first.`,
                            variant: "destructive",
                          });
                          return;
                        }
                        // Drill down to show seats in this section
                        setSelectedSectionId(section.id);
                        setZoomLevel(1);
                        setPanOffset({ x: 0, y: 0 });
                      }}
                    />
                  );
                })
              : // Seat-level or section drill-down: Display individual seats
                displayedSeats.map((seat) => {
                  if (!seat.x_coordinate || !seat.y_coordinate) return null;

                  // Convert percentage coordinates to stage coordinates using same logic as layout designer
                  const { x, y } = percentageToStage(
                    seat.x_coordinate,
                    seat.y_coordinate
                  );

                  // Find event seat by seat_id or location
                  let eventSeat: EventSeat | undefined;
                  // First try by seat_id (most reliable)
                  if (seat.id && seatStatusMap.has(seat.id)) {
                    eventSeat = seatStatusMap.get(seat.id);
                  }
                  // Fallback to location-based matching (for broker imports or when seat_id is missing)
                  if (!eventSeat && seat.row && seat.seat_number) {
                    // Try location-based matching with section name
                    const sectionName =
                      seat.section_name || sectionNameMap.get(seat.section_id);
                    if (sectionName) {
                      // Try with seat.row (layout seat uses 'row') - event seats use row_name
                      // The backend should set row_name to match row when initializing from layout
                      const key = `${sectionName}|${seat.row}|${seat.seat_number}`;
                      eventSeat = locationStatusMap.get(key);
                    }
                  }

                  const isSelected = Boolean(
                    seat.id && selectedSeatIds.has(seat.id)
                  );

                  return (
                    <SeatMarker
                      key={seat.id}
                      seat={seat}
                      eventSeat={eventSeat}
                      x={x}
                      y={y}
                      isHovered={hoveredSeatId === seat.id}
                      isSpacePressed={isSpacePressed}
                      isSelected={isSelected}
                      imageWidth={displayedWidth}
                      imageHeight={displayedHeight}
                      onMouseEnter={(e) => {
                        setHoveredSeatId(seat.id);
                        setHoveredSeatData({ seat, eventSeat });
                        // Calculate position immediately
                        updatePopoverPosition(e);
                      }}
                      onMouseMove={updatePopoverPosition}
                      onMouseLeave={() => {
                        setHoveredSeatId(null);
                        setHoveredSeatPosition(null);
                        setHoveredSeatData(null);
                      }}
                      onClick={() => {
                        // Only allow clicking on available seats for selection
                        if (eventSeat?.status === "available") {
                          if (onSeatClick) {
                            onSeatClick(seat.id, eventSeat);
                          } else {
                            // TODO: Open seat detail/edit dialog
                            console.log("Seat clicked:", seat, eventSeat);
                          }
                        }
                        // Non-available seats are not clickable for selection
                      }}
                    />
                  );
                })}
          </Layer>
        </Stage>
      </div>

      {/* Section Breadcrumb with Back Icon - Show when in section drill-down mode */}
      {layout.design_mode === "section-level" &&
        selectedSectionId &&
        selectedSection && (
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackToSections}
                className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 transition-colors"
                title="Back to Sections"
              >
                <ArrowLeft className="h-4 w-4 text-gray-700" />
              </button>
              <div className="text-sm font-medium text-gray-900">
                Section: {selectedSection.name}
              </div>
            </div>
          </div>
        )}

      {/* Zoom Controls */}
      <ZoomControls
        zoomLevel={zoomLevel}
        panOffset={panOffset}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />

      {/* Legend - Only show when not in section drill-down mode or show in different position */}
      {!(layout.design_mode === "section-level" && selectedSectionId) && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
          <div className="text-xs font-medium mb-2">Seat Status</div>
          <div className="space-y-1">
            {Object.entries(EventSeatStatusEnum).map(([key, value]) => {
              const colors = getSeatStatusColor(value);
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: colors.fill,
                      border: `1px solid ${colors.stroke}`,
                    }}
                  />
                  <span>{key}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend for section drill-down mode - positioned differently */}
      {layout.design_mode === "section-level" && selectedSectionId && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
          <div className="text-xs font-medium mb-2">Seat Status</div>
          <div className="space-y-1">
            {Object.entries(EventSeatStatusEnum).map(([key, value]) => {
              const colors = getSeatStatusColor(value);
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: colors.fill,
                      border: `1px solid ${colors.stroke}`,
                    }}
                  />
                  <span>{key}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section Tooltip/Popover for section-level layouts */}
      {layout.design_mode === "section-level" &&
        !selectedSectionId &&
        hoveredSectionId &&
        hoveredSeatPosition &&
        hoveredSectionData &&
        createPortal(
          <div
            className="fixed z-[9999] rounded-lg border border-gray-300 bg-white p-4 shadow-2xl"
            style={{
              left: `${hoveredSeatPosition.x}px`,
              top: `${hoveredSeatPosition.y}px`,
              pointerEvents: "none",
              width: "320px",
              backgroundColor: "#ffffff",
              opacity: 1,
              backdropFilter: "none",
            }}
          >
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-1">
                  Section Information
                </h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Section Name:</span>
                    <span className="font-medium text-gray-900">
                      {hoveredSectionData.section.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Seats:</span>
                    <span className="font-medium text-gray-900">
                      {hoveredSectionData.seatCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event Seats:</span>
                    <span className="font-medium text-gray-900">
                      {hoveredSectionData.eventSeatCount} /{" "}
                      {hoveredSectionData.seatCount}
                    </span>
                  </div>
                </div>
              </div>

              {Object.keys(hoveredSectionData.statusSummary).length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-sm mb-1">Status Summary</h4>
                  <div className="space-y-1.5 text-sm">
                    {Object.entries(hoveredSectionData.statusSummary).map(
                      ([status, count]) => {
                        const colors = getSeatStatusColor(
                          status as EventSeatStatus
                        );
                        return (
                          <div
                            key={status}
                            className="flex justify-between items-center"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: colors.fill,
                                  border: `1px solid ${colors.stroke}`,
                                }}
                              />
                              <span className="text-gray-600">{status}:</span>
                            </div>
                            <span className="font-medium text-gray-900">
                              {count}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Seat Tooltip/Popover for seat-level layouts - Rendered via Portal */}
      {(layout.design_mode !== "section-level" || selectedSectionId) &&
        hoveredSeatId &&
        hoveredSeatPosition &&
        hoveredSeatData &&
        createPortal(
          <div
            className="fixed z-[9999] rounded-lg border border-gray-300 bg-white p-4 shadow-2xl"
            style={{
              left: `${hoveredSeatPosition.x}px`,
              top: `${hoveredSeatPosition.y}px`,
              pointerEvents: "none",
              width: "320px",
              backgroundColor: "#ffffff",
              opacity: 1,
              backdropFilter: "none",
            }}
          >
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-1">Seat Information</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Section:</span>
                    <span className="font-medium text-gray-900">
                      {hoveredSeatData.seat.section_name ||
                        sectionNameMap.get(hoveredSeatData.seat.section_id) ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Row:</span>
                    <span className="font-medium text-gray-900">
                      {hoveredSeatData.seat.row || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seat Number:</span>
                    <span className="font-medium text-gray-900">
                      {hoveredSeatData.seat.seat_number || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seat Type:</span>
                    <span className="font-medium text-gray-900">
                      {hoveredSeatData.seat.seat_type || "STANDARD"}
                    </span>
                  </div>
                </div>
              </div>

              {hoveredSeatData.eventSeat ? (
                <div className="border-t pt-3">
                  <h4 className="font-semibold text-sm mb-1">
                    Event Seat Status
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor:
                            getSeatStatusColor(hoveredSeatData.eventSeat.status)
                              .fill + "20",
                          color: getSeatStatusColor(
                            hoveredSeatData.eventSeat.status
                          ).stroke,
                          border: `1px solid ${getSeatStatusColor(hoveredSeatData.eventSeat.status).stroke}`,
                        }}
                      >
                        {hoveredSeatData.eventSeat.status}
                      </span>
                    </div>
                    {(hoveredSeatData.eventSeat.status === EventSeatStatusEnum.HELD ||
                      hoveredSeatData.eventSeat.status === EventSeatStatusEnum.BLOCKED) &&
                      hoveredSeatData.eventSeat.attributes && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {hoveredSeatData.eventSeat.status === EventSeatStatusEnum.HELD ? "Hold" : "Block"} Reason:
                        </span>
                        <span className="font-medium text-gray-900 max-w-32 truncate" title={
                          hoveredSeatData.eventSeat.status === EventSeatStatusEnum.HELD
                            ? hoveredSeatData.eventSeat.attributes.hold_reason || "No reason provided"
                            : hoveredSeatData.eventSeat.attributes.block_reason || "No reason provided"
                        }>
                          {hoveredSeatData.eventSeat.status === EventSeatStatusEnum.HELD
                            ? hoveredSeatData.eventSeat.attributes.hold_reason || "No reason provided"
                            : hoveredSeatData.eventSeat.attributes.block_reason || "No reason provided"}
                        </span>
                      </div>
                    )}
                    {hoveredSeatData.eventSeat.ticket_number && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ticket Number:</span>
                        <span className="font-medium text-gray-900">
                          {hoveredSeatData.eventSeat.ticket_number}
                        </span>
                      </div>
                    )}
                    {hoveredSeatData.eventSeat.ticket_price !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ticket Price:</span>
                        <span className="font-medium text-gray-900">
                          ${hoveredSeatData.eventSeat.ticket_price.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {hoveredSeatData.eventSeat.broker_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Broker ID:</span>
                        <span className="font-medium text-gray-900">
                          {hoveredSeatData.eventSeat.broker_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-500 italic">
                    No event seat assigned
                  </p>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
