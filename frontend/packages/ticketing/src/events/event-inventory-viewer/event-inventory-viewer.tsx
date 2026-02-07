/**
 * Event Inventory Viewer Component
 *
 * Displays venue layout with event seats overlaid, showing seat status
 */

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import Konva from "konva";
import { createPortal } from "react-dom";
import { cn } from "@truths/ui/lib/utils";
import { ZoomControls } from "../../seats/seat-designer/components/zoom-controls";
import type { Layout } from "../../layouts/types";
import type { Section } from "../../layouts/types";
import type { Seat } from "../../seats/types";
import type { EventSeat } from "../types";
import { EventSeatStatus as EventSeatStatusEnum } from "../types";
import { EventInventoryStage } from "./event-inventory-stage";
import { EventInventoryLegend } from "./event-inventory-legend";
import { EventInventoryBreadcrumb } from "./event-inventory-breadcrumb";
import { EventInventorySectionPopover } from "./event-inventory-section-popover";
import { EventInventorySeatPopover } from "./event-inventory-seat-popover";

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
  const [internalSelectedSectionId, setInternalSelectedSectionId] = useState<
    string | null
  >(null);
  const selectedSectionId =
    controlledSelectedSectionId !== undefined
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
      <EventInventoryStage
        containerRef={containerRef}
        stageRef={stageRef}
        validWidth={validWidth}
        validHeight={validHeight}
        centerX={centerX}
        centerY={centerY}
        imageX={imageX}
        imageY={imageY}
        displayedWidth={displayedWidth}
        displayedHeight={displayedHeight}
        image={image}
        zoomLevel={zoomLevel}
        panOffset={panOffset}
        isSpacePressed={isSpacePressed}
        isPanning={isPanning}
        hoveredSeatId={hoveredSeatId}
        layout={layout}
        selectedSectionId={selectedSectionId}
        sections={sections}
        sectionStats={sectionStats}
        displayedSeats={displayedSeats}
        seatStatusMap={seatStatusMap}
        locationStatusMap={locationStatusMap}
        sectionNameMap={sectionNameMap}
        selectedSeatIds={selectedSeatIds}
        hoveredSectionId={hoveredSectionId}
        percentageToStage={percentageToStage}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        setHoveredSectionId={setHoveredSectionId}
        setHoveredSectionData={setHoveredSectionData}
        setHoveredSeatPosition={setHoveredSeatPosition}
        setHoveredSeatId={setHoveredSeatId}
        setHoveredSeatData={setHoveredSeatData}
        updatePopoverPosition={updatePopoverPosition}
        setSelectedSectionId={setSelectedSectionId}
        setZoomLevel={setZoomLevel}
        setPanOffset={setPanOffset}
        onSeatClick={onSeatClick}
      />

      {layout.design_mode === "section-level" &&
        selectedSectionId &&
        selectedSection && (
          <EventInventoryBreadcrumb
            section={selectedSection}
            onBack={handleBackToSections}
            className="absolute top-4 left-4"
          />
        )}

      {/* Zoom Controls */}
      <ZoomControls
        zoomLevel={zoomLevel}
        panOffset={panOffset}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />

      {!(layout.design_mode === "section-level" && selectedSectionId) && (
        <EventInventoryLegend className="absolute top-4 left-4" />
      )}

      {layout.design_mode === "section-level" && selectedSectionId && (
        <EventInventoryLegend className="absolute bottom-4 left-4" />
      )}

      {layout.design_mode === "section-level" &&
        !selectedSectionId &&
        hoveredSectionId &&
        hoveredSeatPosition &&
        hoveredSectionData &&
        createPortal(
          <EventInventorySectionPopover
            section={hoveredSectionData.section}
            seatCount={hoveredSectionData.seatCount}
            eventSeatCount={hoveredSectionData.eventSeatCount}
            statusSummary={hoveredSectionData.statusSummary}
            x={hoveredSeatPosition.x}
            y={hoveredSeatPosition.y}
          />,
          document.body
        )}

      {(layout.design_mode !== "section-level" || selectedSectionId) &&
        hoveredSeatId &&
        hoveredSeatPosition &&
        hoveredSeatData &&
        createPortal(
          <EventInventorySeatPopover
            seat={hoveredSeatData.seat}
            eventSeat={hoveredSeatData.eventSeat}
            sectionName={
              hoveredSeatData.seat.section_name ||
              sectionNameMap.get(hoveredSeatData.seat.section_id) ||
              "N/A"
            }
            x={hoveredSeatPosition.x}
            y={hoveredSeatPosition.y}
          />,
          document.body
        )}
    </div>
  );
}
