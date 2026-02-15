/**
 * Seat Designer Canvas Component
 *
 * Wraps FloorPlanCanvas + ZoomControls with optional ImageUploadCard.
 * Used when designing seats only (designMode="seat-level", no sections).
 * Shared by seat-level main view and section-level drill-down.
 */

import React, { useRef, useState } from "react";
import Konva from "konva";
import { FloorPlanCanvas } from "../floor-plan-canvas";
import { ImageUploadCard, ZoomControls } from "./index";
import type { SeatMarker } from "../types";
import type { PlacementShape } from "../types";
import { PlacementShapeType } from "../types";

export interface SeatDesignerCanvasProps {
  image: {
    /** When undefined/empty, renders blank canvas (simple floor mode) */
    imageUrl?: string;
    /** When true and no imageUrl, render ImageUploadCard instead of canvas. When false, render blank canvas. */
    showImageUpload?: boolean;
    imageUploadId?: string;
    imageUploadLabel?: string;
    onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isUploadingImage?: boolean;
  };
  container: {
    containerRef: React.RefObject<HTMLDivElement>;
    dimensionsReady: boolean;
    containerDimensions: { width: number; height: number };
    /** "fixed" = 600px height (seat-level), "flex" = minHeight 600px flex-1 (section drill-down) */
    containerStyle?: "fixed" | "flex";
  };
  seats: {
    seats: SeatMarker[];
    selectedSeatId?: string | null;
    selectedSeatIds?: string[];
  };
  view: {
    zoomLevel: number;
    panOffset: { x: number; y: number };
    /** Background color when no image (simple floor mode). Default #e5e7eb */
    canvasBackgroundColor?: string;
  };
  toolbar: {
    isPlacingSeats: boolean;
    readOnly?: boolean;
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
    /** Show grid lines on canvas */
    showGrid?: boolean;
    /** Grid size in percentage */
    gridSize?: number;
  };
  handlers: {
    onSeatClick?: (seat: SeatMarker, event?: { shiftKey?: boolean }) => void;
    onSeatDragEnd: (seatId: string, newX: number, newY: number) => void;
    onBatchSeatDragEnd?: (
      updates: Array<{ id: string; x: number; y: number }>,
    ) => void;
    onSeatShapeTransform?: (
      seatId: string,
      shape: PlacementShape,
      position?: { x: number; y: number },
    ) => void;
    onImageClick?: (
      e: Konva.KonvaEventObject<MouseEvent>,
      percentageCoords?: { x: number; y: number },
    ) => void;
    onDeselect?: () => void;
    onShapeDraw?: (
      shape: PlacementShape,
      x: number,
      y: number,
      width?: number,
      height?: number,
    ) => void;
    onShapeOverlayClick?: (overlayId: string) => void;
    onMarkersInRect?: (seatIds: string[], sectionIds: string[]) => void;
    onWheel?: (
      e: Konva.KonvaEventObject<WheelEvent>,
      isSpacePressed: boolean,
    ) => void;
    onPan?: (delta: { x: number; y: number }) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom: () => void;
  };
}

export function SeatDesignerCanvas({
  image,
  container,
  seats,
  view,
  toolbar,
  handlers,
}: SeatDesignerCanvasProps) {
  const {
    imageUrl,
    showImageUpload = false,
    imageUploadId,
    imageUploadLabel,
    onImageUpload,
    isUploadingImage = false,
  } = image;
  const {
    containerRef,
    dimensionsReady,
    containerDimensions,
    containerStyle = "fixed",
  } = container;
  const {
    seats: seatsList,
    selectedSeatId,
    selectedSeatIds = [],
  } = seats;
  const {
    zoomLevel,
    panOffset,
    canvasBackgroundColor = "#e5e7eb",
  } = view;
  const {
    isPlacingSeats,
    readOnly,
    selectedShapeTool,
    shapeOverlays,
    selectedOverlayId,
    showGrid = false,
    gridSize = 5,
  } = toolbar;
  const {
    onSeatClick,
    onSeatDragEnd,
    onBatchSeatDragEnd,
    onSeatShapeTransform,
    onImageClick,
    onDeselect,
    onShapeDraw,
    onShapeOverlayClick,
    onMarkersInRect,
    onWheel,
    onPan,
    onZoomIn,
    onZoomOut,
    onResetZoom,
  } = handlers;
  const [dragOverActive, setDragOverActive] = useState(false);

  // Compute the virtual canvas dimensions matching layout-canvas logic so drop
  // coordinates convert correctly.  No-image uses a fixed 4:3 AR letterboxed
  // into the locked canvas size.
  const NO_IMAGE_ASPECT_RATIO = 3 / 4; // 0.75 (4:3)
  const noImageInitialSizeRef = useRef<{ w: number; h: number } | null>(null);
  const hasImage = !!imageUrl;
  if (
    !hasImage &&
    containerDimensions.width > 0 &&
    containerDimensions.height > 0
  ) {
    if (!noImageInitialSizeRef.current) {
      noImageInitialSizeRef.current = {
        w: containerDimensions.width,
        h: containerDimensions.height,
      };
    }
  } else if (hasImage) {
    noImageInitialSizeRef.current = null;
  }
  let dropCanvasW = 800;
  if (hasImage) {
    dropCanvasW = containerDimensions.width > 0 ? containerDimensions.width : 800;
  } else {
    dropCanvasW =
      noImageInitialSizeRef.current?.w ??
      (containerDimensions.width > 0 ? containerDimensions.width : 800);
  }
  let dropCanvasH = 600;
  if (hasImage) {
    dropCanvasH = containerDimensions.height > 0 ? containerDimensions.height : 600;
  } else {
    dropCanvasH =
      noImageInitialSizeRef.current?.h ??
      (containerDimensions.height > 0 ? containerDimensions.height : 600);
  }
  // Letterbox the content AR into the locked canvas
  const dropContentAR = hasImage
    ? dropCanvasH / dropCanvasW
    : NO_IMAGE_ASPECT_RATIO;
  const dropCanvasAR = dropCanvasH / dropCanvasW;
  let dropDisplayedW: number, dropDisplayedH: number;
  if (dropContentAR > dropCanvasAR) {
    dropDisplayedH = dropCanvasH;
    dropDisplayedW = dropDisplayedH / dropContentAR;
  } else {
    dropDisplayedW = dropCanvasW;
    dropDisplayedH = dropDisplayedW * dropContentAR;
  }
  const dropOffsetX = (dropCanvasW - dropDisplayedW) / 2;
  const dropOffsetY = (dropCanvasH - dropDisplayedH) / 2;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) {
      setDragOverActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverActive(false);

    const dragData = e.dataTransfer.getData("application/json");
    if (!dragData || !onShapeDraw) return;

    try {
      const { shapeType, dragSource } = JSON.parse(dragData);
      if (dragSource !== "shape-toolbox" || !shapeType) return;

      // Type-safe access to shape type
      const typedShapeType = shapeType as PlacementShapeType;
      if (!Object.values(PlacementShapeType).includes(typedShapeType)) {
        return;
      }

      // Get container position
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Calculate drop position relative to container
      const dropX = e.clientX - rect.left;
      const dropY = e.clientY - rect.top;

      // Convert to percentage coordinates (0-100) accounting for zoom, pan, and
      // the letterboxed virtual canvas (matches layout-canvas coordinate system).
      const layerX = (dropX - panOffset.x) / zoomLevel;
      const layerY = (dropY - panOffset.y) / zoomLevel;
      const percentageX = ((layerX - dropOffsetX) / dropDisplayedW) * 100;
      const percentageY = ((layerY - dropOffsetY) / dropDisplayedH) * 100;

      // Create default shape based on type
      const defaultShapes: Record<PlacementShapeType, PlacementShape> = {
        [PlacementShapeType.CIRCLE]: {
          type: PlacementShapeType.CIRCLE,
          radius: 2,
          fillColor: "#60a5fa",
          strokeColor: "#2563eb",
        },
        [PlacementShapeType.RECTANGLE]: {
          type: PlacementShapeType.RECTANGLE,
          width: 4,
          height: 3,
          fillColor: "#60a5fa",
          strokeColor: "#2563eb",
        },
        [PlacementShapeType.ELLIPSE]: {
          type: PlacementShapeType.ELLIPSE,
          width: 4,
          height: 3,
          fillColor: "#60a5fa",
          strokeColor: "#2563eb",
        },
        [PlacementShapeType.POLYGON]: {
          type: PlacementShapeType.POLYGON,
          points: [-1.5, -1, 1.5, -1, 2, 1, 0, 2, -2, 1],
          fillColor: "#60a5fa",
          strokeColor: "#2563eb",
        },
        [PlacementShapeType.FREEFORM]: {
          type: PlacementShapeType.FREEFORM,
          points: [0, 50, 50, 0, 100, 50, 50, 100], // Diamond shape
          fillColor: "#60a5fa", // Assuming DEFAULT_SHAPE_FILL is #60a5fa
          strokeColor: "#2563eb", // Assuming DEFAULT_SHAPE_STROKE is #2563eb
        },
        [PlacementShapeType.SOFA]: {
          type: PlacementShapeType.SOFA,
          width: 36,
          height: 24,
          fillColor: "#60a5fa", // Assuming DEFAULT_SHAPE_FILL
          strokeColor: "#2563eb", // Assuming DEFAULT_SHAPE_STROKE
        },
        [PlacementShapeType.STAGE]: {
          type: PlacementShapeType.STAGE,
          width: 150,
          height: 80,
          fillColor: "#333333", // Darker for stage
          strokeColor: "#2563eb", // Assuming DEFAULT_SHAPE_STROKE
        },
        [PlacementShapeType.SEAT]: {
          type: PlacementShapeType.SEAT,
          width: 4,
          height: 3,
          fillColor: "#60a5fa",
          strokeColor: "#2563eb",
        },
      };

      const shape = defaultShapes[typedShapeType];
      if (!shape) return;

      // Call onShapeDraw with the dropped shape and percentage coordinates
      onShapeDraw(shape, percentageX, percentageY);
    } catch (error) {
      console.error("Error processing shape drop:", error);
    }
  };

  if (showImageUpload && !imageUrl) {
    return (
      <ImageUploadCard
        id={imageUploadId ?? "seat-design-image-upload"}
        label={imageUploadLabel ?? "Upload Floor Plan Image"}
        isUploading={isUploadingImage}
        onFileSelect={onImageUpload ?? (() => {})}
      />
    );
  }

  // When !imageUrl and !showImageUpload: render blank canvas (simple floor mode)

  const containerStyleProps =
    containerStyle === "fixed"
      ? {
          height: "600px" as const,
          width: "100%" as const,
          touchAction: "none" as const,
          overscrollBehavior: "contain" as const,
        }
      : {
          minHeight: "600px" as const,
          minWidth: 0 as const,
          display: "flex" as const,
          flexDirection: "column" as const,
          height: "100%" as const,
        };

  return (
    <div
      ref={containerRef}
      className={`relative border rounded-lg overflow-hidden select-none w-full transition-colors ${
        imageUrl ? "bg-gray-100" : ""
      } ${dragOverActive ? "ring-2 ring-primary bg-primary/5" : ""}`}
      style={
        imageUrl
          ? containerStyleProps
          : { ...containerStyleProps, backgroundColor: canvasBackgroundColor }
      }
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dimensionsReady ? (
        <>
          <FloorPlanCanvas
            data={{
              imageUrl: imageUrl ?? undefined,
              seats: seatsList,
              sections: [],
            }}
            selection={{
              selectedSeatId: selectedSeatId ?? null,
              selectedSeatIds,
            }}
            placement={{
              isPlacingSeats,
              isPlacingSections: false,
              readOnly,
            }}
            view={{
              zoomLevel,
              panOffset,
              containerWidth: containerDimensions.width,
              containerHeight: containerDimensions.height,
              canvasBackgroundColor,
              showGrid,
              gridSize,
            }}
            design={{
              designMode: "seat-level",
              selectedShapeTool: selectedShapeTool ?? null,
              shapeOverlays,
              selectedOverlayId,
            }}
            handlers={{
              onSeatClick,
              onSeatDragEnd,
              onBatchSeatDragEnd,
              onSeatShapeTransform,
              onImageClick,
              onDeselect,
              onShapeDraw,
              onShapeOverlayClick,
              onWheel,
              onPan,
              onMarkersInRect,
            }}
          />
          <ZoomControls
            zoomLevel={zoomLevel}
            panOffset={panOffset}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onResetZoom={onResetZoom}
          />
        </>
      ) : (
        <div className="flex items-center justify-center w-full h-full py-12 text-muted-foreground">
          Initializing canvas...
        </div>
      )}
    </div>
  );
}
