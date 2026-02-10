/**
 * Seat Design Canvas Component
 *
 * Wraps LayoutCanvas + ZoomControls with optional ImageUploadCard.
 * Used when designing seats only (venueType="small", no sections).
 * Shared by seat-level main view and section-level drill-down.
 */

import React, { useState } from "react";
import Konva from "konva";
import { LayoutCanvas } from "../layout-canvas";
import { ImageUploadCard, ZoomControls } from "./index";
import type { SeatMarker } from "../types";
import type { PlacementShape } from "../types";
import { PlacementShapeType } from "../types";

export interface SeatDesignCanvasProps {
  /** When undefined/empty, renders blank canvas (simple floor mode) */
  imageUrl?: string;
  /** When true and no imageUrl, render ImageUploadCard instead of canvas. When false, render blank canvas. */
  showImageUpload?: boolean;
  imageUploadId?: string;
  imageUploadLabel?: string;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingImage?: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  dimensionsReady: boolean;
  containerDimensions: { width: number; height: number };
  /** "fixed" = 600px height (seat-level), "flex" = minHeight 600px flex-1 (section drill-down) */
  containerStyle?: "fixed" | "flex";
  seats: SeatMarker[];
  selectedSeatId?: string | null;
  selectedSeatIds?: string[];
  isPlacingSeats: boolean;
  readOnly?: boolean;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  onSeatClick?: (seat: SeatMarker, event?: { shiftKey?: boolean }) => void;
  onSeatDragEnd: (seatId: string, newX: number, newY: number) => void;
  onSeatShapeTransform?: (seatId: string, shape: PlacementShape) => void;
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
  onWheel?: (
    e: Konva.KonvaEventObject<WheelEvent>,
    isSpacePressed: boolean,
  ) => void;
  onPan?: (delta: { x: number; y: number }) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
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
  /** Background color when no image (simple floor mode). Default #e5e7eb */
  canvasBackgroundColor?: string;
  /** Show grid lines on canvas */
  showGrid?: boolean;
  /** Grid size in percentage */
  gridSize?: number;
}

export function SeatDesignCanvas({
  imageUrl,
  showImageUpload = false,
  imageUploadId,
  imageUploadLabel,
  onImageUpload,
  isUploadingImage = false,
  containerRef,
  dimensionsReady,
  containerDimensions,
  containerStyle = "fixed",
  seats,
  selectedSeatId,
  selectedSeatIds = [],
  isPlacingSeats,
  readOnly,
  zoomLevel,
  panOffset,
  onSeatClick,
  onSeatDragEnd,
  onSeatShapeTransform,
  onImageClick,
  onDeselect,
  onShapeDraw,
  onShapeOverlayClick,
  onWheel,
  onPan,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  selectedShapeTool,
  shapeOverlays,
  selectedOverlayId,
  canvasBackgroundColor = "#e5e7eb",
  showGrid = false,
  gridSize = 5,
}: SeatDesignCanvasProps) {
  const [dragOverActive, setDragOverActive] = useState(false);

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

      // Convert to percentage coordinates (0-100) accounting for zoom and pan
      const percentageX =
        ((dropX - panOffset.x) / zoomLevel / containerDimensions.width) * 100;
      const percentageY =
        ((dropY - panOffset.y) / zoomLevel / containerDimensions.height) * 100;

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
          points: [0, 0, 2, 0, 3, 2, 2, 3, 0, 3, -1, 2],
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
          <LayoutCanvas
            imageUrl={imageUrl ?? undefined}
            seats={seats}
            sections={[]}
            selectedSeatId={selectedSeatId ?? null}
            selectedSeatIds={selectedSeatIds}
            isPlacingSeats={isPlacingSeats}
            isPlacingSections={false}
            readOnly={readOnly}
            zoomLevel={zoomLevel}
            panOffset={panOffset}
            onSeatClick={onSeatClick}
            onSeatDragEnd={onSeatDragEnd}
            onSeatShapeTransform={onSeatShapeTransform}
            onImageClick={onImageClick}
            onDeselect={onDeselect}
            onShapeDraw={onShapeDraw}
            onShapeOverlayClick={onShapeOverlayClick}
            onWheel={onWheel}
            onPan={onPan}
            containerWidth={containerDimensions.width}
            containerHeight={containerDimensions.height}
            venueType="small"
            selectedShapeTool={selectedShapeTool ?? null}
            shapeOverlays={shapeOverlays}
            selectedOverlayId={selectedOverlayId}
            canvasBackgroundColor={canvasBackgroundColor}
            showGrid={showGrid}
            gridSize={gridSize}
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
