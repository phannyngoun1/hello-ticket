/**
 * Seat Design Canvas Component
 *
 * Wraps LayoutCanvas + ZoomControls with optional ImageUploadCard.
 * Used when designing seats only (venueType="small", no sections).
 * Shared by seat-level main view and section-level drill-down.
 */

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
  isPlacingSeats: boolean;
  readOnly?: boolean;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  onSeatClick?: (seat: SeatMarker, event?: { shiftKey?: boolean }) => void;
  onSeatDragEnd: (seatId: string, newX: number, newY: number) => void;
  onSeatShapeTransform?: (seatId: string, shape: PlacementShape) => void;
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
}: SeatDesignCanvasProps) {
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
      className={`relative border rounded-lg overflow-hidden select-none w-full ${
        imageUrl ? "bg-gray-100" : "bg-blue-50"
      }`}
      style={containerStyleProps}
    >
      {dimensionsReady ? (
        <>
          <LayoutCanvas
            imageUrl={imageUrl ?? undefined}
            seats={seats}
            sections={[]}
            selectedSeatId={selectedSeatId ?? null}
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
