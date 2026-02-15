/**
 * Event Inventory Viewer Component
 *
 * Displays venue layout with event seats overlaid, showing seat status
 */

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import Konva from "konva";
import { createPortal } from "react-dom";
import { cn } from "@truths/ui/lib/utils";
import { ZoomControls } from "../seat-designer/components/zoom-controls";
import {
  useContainerSize,
  useCanvasZoom,
  useCanvasPan,
  useLetterboxing,
  NO_IMAGE_ASPECT_RATIO,
} from "../seat-designer/hooks";
import type { Layout } from "../../layouts/types";
import type { Section } from "../../layouts/types";
import type { Seat } from "../../seats/types";
import type { EventSeat } from "../../events/types";
import { EventSeatStatus as EventSeatStatusEnum } from "../../events/types";
import { EventInventoryStage } from "./event-inventory-stage";
import { EventInventoryLegend } from "./event-inventory-legend";
import { EventInventoryBreadcrumb } from "./event-inventory-breadcrumb";
import { EventInventorySectionPopover } from "./event-inventory-section-popover";
import { EventInventorySeatPopover } from "./event-inventory-seat-popover";
import {
  DEFAULT_CANVAS_BACKGROUND,
  DARK_MODE_CANVAS_BACKGROUND,
} from "./event-inventory-viewer-colors";
import { useSectionStats } from "./hooks/use-section-stats";
import { useDarkMode } from "./hooks/use-dark-mode";
import { usePopoverPosition } from "./hooks/use-popover-position";

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
  /** Hide the seat-status legend overlay on the canvas (default false) */
  showLegend?: boolean;
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
  showLegend = true,
}: EventInventoryViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);
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

  // Use custom hooks
  const sectionStats = useSectionStats(
    layout,
    sections,
    layoutSeats,
    seatStatusMap,
    locationStatusMap,
    sectionNameMap
  );

  const { hoveredSeatPosition, setHoveredSeatPosition, updatePopoverPosition } =
    usePopoverPosition({ containerRef });

  // Get selected section for drill-down
  const selectedSection = useMemo(() => {
    if (!selectedSectionId) return null;
    return sections.find((s) => s.id === selectedSectionId) || null;
  }, [selectedSectionId, sections]);

  const isDarkMode = useDarkMode();

  // Get canvas background color (use section's color when drilled down, otherwise layout's)
  const canvasBackgroundColor = useMemo(() => {
    if (selectedSection?.canvas_background_color) {
      return selectedSection.canvas_background_color;
    }
    if (layout.canvas_background_color) {
      return layout.canvas_background_color;
    }
    return isDarkMode ? DARK_MODE_CANVAS_BACKGROUND : DEFAULT_CANVAS_BACKGROUND;
  }, [selectedSection, layout.canvas_background_color, isDarkMode]);

  // Get image URL - use section image if in drill-down mode, otherwise use layout image
  // When drilled into a section, only use that section's own image (don't fall back to layout image)
  const displayImageUrl = useMemo(() => {
    if (selectedSection) {
      return selectedSection.image_url || undefined;
    }
    return imageUrl;
  }, [selectedSection, imageUrl]);

  // Filter seats by selected section when in drill-down mode
  const displayedSeats = useMemo(() => {
    if (layout.design_mode === "section-level" && selectedSectionId) {
      return layoutSeats.filter(
        (seat) => seat.section_id === selectedSectionId,
      );
    }
    return layoutSeats;
  }, [layout.design_mode, selectedSectionId, layoutSeats]);

  // Load image (when no displayImageUrl, use simple floor mode - no image, blank canvas)
  useEffect(() => {
    if (!displayImageUrl) {
      setImage(null);
      setImageLoaded(true); // Ready to render blank canvas
      return;
    }

    setImageLoaded(false);
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

  const hasImage = !!image && !!image.width && !!image.height;
  const isCanvasReady =
    !isLoading && (!displayImageUrl || (imageLoaded && hasImage));

  // Shared canvas hooks
  const containerSize = useContainerSize(containerRef, {
    enabled: isCanvasReady,
    lockFirstSize: !hasImage,
    resetLockKey: `${layout.id}-${hasImage}`,
  });

  const {
    zoomLevel,
    setZoomLevel,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom: baseHandleResetZoom,
  } = useCanvasZoom({
    minZoom: 0.1,
    maxZoom: 5,
    zoomFactor: 1.2,
  });

  const {
    panOffset,
    setPanOffset,
    isSpacePressed,
    isPanning,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    resetPan,
  } = useCanvasPan();

  const handleResetZoom = useCallback(() => {
    baseHandleResetZoom();
    resetPan();
  }, [baseHandleResetZoom, resetPan]);

  const handleBackToSections = useCallback(() => {
    if (onSelectedSectionIdChange) {
      onSelectedSectionIdChange(null);
    } else {
      setInternalSelectedSectionId(null);
    }
    handleResetZoom();
  }, [onSelectedSectionIdChange, handleResetZoom]);

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
      const layerX = (pointer.x - (centerX + panOffset.x)) / oldScale + centerX;
      const layerY = (pointer.y - (centerY + panOffset.y)) / oldScale + centerY;

      // Calculate new pan offset so the point at (layerX, layerY) stays at pointer position
      const newPanX = pointer.x - centerX - (layerX - centerX) * clampedScale;
      const newPanY = pointer.y - centerY - (layerY - centerY) * clampedScale;

      setZoomLevel(clampedScale);
      setPanOffset({
        x: newPanX,
        y: newPanY,
      });
    },
    [zoomLevel, panOffset, containerSize, setZoomLevel, setPanOffset],
  );

  // Letterboxing: compute displayed dimensions and coordinate conversion
  const validWidth = containerSize.width > 0 ? containerSize.width : 800;
  const validHeight = containerSize.height > 0 ? containerSize.height : 600;
  const contentAspectRatio = hasImage
    ? image!.height / image!.width
    : NO_IMAGE_ASPECT_RATIO;

  const {
    displayedWidth,
    displayedHeight,
    imageX,
    imageY,
    centerX,
    centerY,
    percentageToStage,
  } = useLetterboxing({
    containerWidth: validWidth,
    containerHeight: validHeight,
    contentAspectRatio,
  });

  return (
    <div
      className={cn(
        "relative border rounded-lg bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700",
        hasImage ? "overflow-hidden" : "overflow-auto",
        className,
      )}
      style={{ minHeight: "600px", height: "70vh" }}
    >
      {!isCanvasReady ? (
        <div
          className="flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800"
          style={{
            width: validWidth,
            height: validHeight,
          }}
        >
          <div className="text-muted-foreground">Loading seats...</div>
        </div>
      ) : (
        <>
          <EventInventoryStage
            isDarkMode={isDarkMode}
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
            canvasBackgroundColor={canvasBackgroundColor}
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

          {showLegend &&
            !(layout.design_mode === "section-level" && selectedSectionId) && (
              <EventInventoryLegend className="absolute top-4 left-4" />
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
              document.body,
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
              document.body,
            )}
        </>
      )}
    </div>
  );
}
