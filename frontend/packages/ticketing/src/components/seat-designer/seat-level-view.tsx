/**
 * Seat Level View
 *
 * Renders the seat-level design UI: SeatDesignToolbar + SeatDesignerCanvas.
 * Used when designMode="seat-level" (single floor plan, place seats directly).
 */

import React from "react";
import Konva from "konva";
import { SeatDesignToolbar, SeatDesignerCanvas, SeatEditControls, ZoomControls } from "./components";
import { getUniqueSections as getUniqueSectionsUtil } from "./utils";
import type { SeatMarker, SectionMarker } from "./types";
import type { SeatFormData } from "./form-schemas";

/** Style object for shape changes (seat/section) */
interface ShapeStyle {
  fillColor?: string;
  strokeColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
}

export interface SeatLevelViewProps {
  canvas: {
    containerRef: React.RefObject<HTMLDivElement>;
    dimensionsReady: boolean;
    containerDimensions: { width: number; height: number };
    isFullscreen: boolean;
    mainImageUrl?: string;
    canvasBackgroundColor: string;
  };
  data: {
    displayedSeats: SeatMarker[];
    seats: SeatMarker[];
    sectionMarkers: SectionMarker[];
    effectiveSectionsData?: Array<{ id: string; name: string }>;
    designMode: "seat-level" | "section-level";
  };
  selection: {
    selectedSeat: SeatMarker | null;
    selectedSeatIds: string[];
    selectedSectionIds: string[];
    selectedSectionMarker: SectionMarker | null;
  };
  forms: {
    seatPlacementForm: import("react-hook-form").UseFormReturn<SeatFormData>;
    sectionSelectValue: string;
    setSectionSelectValue: (value: string) => void;
    seatEditForm: import("react-hook-form").UseFormReturn<SeatFormData>;
    isEditingSeat: boolean;
    sectionForm: { reset: (data?: { name?: string }) => void };
    setSelectedShapeTool: (tool: import("./types").PlacementShapeType | null) => void;
    setViewingSeat: (seat: SeatMarker | null) => void;
    setViewingSection: (section: SectionMarker | null) => void;
    setSelectedSectionMarker: (section: SectionMarker | null) => void;
    setIsEditingSeat: (editing: boolean) => void;
    setIsSectionFormOpen: (open: boolean) => void;
    setEditingSectionId: (id: string | null) => void;
    setSelectedSeatIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    setSelectedSectionIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    setSelectedOverlayId: (id: string | null) => void;
    setIsManageSectionsOpen: (open: boolean) => void;
    onNewSectionFromSeatEdit?: () => void;
    onManageSectionsFromSeatEdit?: () => void;
  };
  actions: {
    recordSnapshot: () => void;
    removeSeat: (id: string) => void;
    removeSection: (id: string) => void;
    updateSeat: (id: string, updates: Partial<SeatMarker>) => void;
  };
  callbacks: {
    onSectionEdit: (section: SectionMarker) => void;
    onSeatShapeStyleChange: (seatId: string, style: ShapeStyle) => void;
    onSectionShapeStyleChange: (sectionId: string, style: ShapeStyle) => void;
    onAlign: (alignment: string) => void;
    onShapeOverlayClick: (id: string) => void;
    onWheel: (
      e: Konva.KonvaEventObject<WheelEvent>,
      isSpacePressed: boolean,
    ) => void;
    onMarkersInRect: (seatIds: string[], sectionIds: string[]) => void;
    handleSeatClickWithToolSwitch: (
      seat: SeatMarker,
      event?: { shiftKey?: boolean },
    ) => void;
    handleKonvaSeatDragEnd: (seatId: string, x: number, y: number) => void;
    handleBatchSeatDragEnd: (
      updates: Array<{ id: string; x: number; y: number }>,
    ) => void;
    handleSeatShapeTransform: (
      seatId: string,
      shape: import("./types").PlacementShape,
      position?: { x: number; y: number },
    ) => void;
    handleKonvaImageClick: (
      e: Konva.KonvaEventObject<MouseEvent>,
      coords?: { x: number; y: number },
    ) => void;
    handleDeselect?: () => void;
    handleShapeDraw: (
      shape: import("./types").PlacementShape,
      x: number,
      y: number,
      width?: number,
      height?: number,
    ) => void;
    handleResetZoomAndPan: () => void;
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handlePanDelta: (delta: { x: number; y: number }) => void;
  };
  toolbar: {
    selectedShapeTool: import("./types").PlacementShapeType | null;
    displayedShapeOverlays: Array<{
      id: string;
      x: number;
      y: number;
      shape: import("./types").PlacementShape;
      onClick?: () => void;
      onHover?: () => void;
      label?: string;
      isSelected?: boolean;
      isPlacement?: boolean;
    }>;
    selectedOverlayId: string | null;
    showGrid: boolean;
    gridSize: number;
    zoomLevel: number;
    panOffset: { x: number; y: number };
    isPlacingSeats: boolean;
    readOnly: boolean;
  };
}

export function SeatLevelView({
  canvas,
  data,
  selection,
  forms,
  actions,
  callbacks,
  toolbar,
}: SeatLevelViewProps) {
  const {
    containerRef,
    dimensionsReady,
    containerDimensions,
    isFullscreen,
    mainImageUrl,
    canvasBackgroundColor,
  } = canvas;
  const {
    displayedSeats,
    seats,
    sectionMarkers,
    effectiveSectionsData,
    designMode,
  } = data;
  const {
    selectedSeat,
    selectedSeatIds,
    selectedSectionIds,
  } = selection;
  const {
    seatPlacementForm,
    sectionSelectValue,
    setSectionSelectValue,
    seatEditForm,
    isEditingSeat,
    sectionForm,
    setViewingSection,
    setSelectedSectionMarker,
    setIsEditingSeat,
    setIsSectionFormOpen,
    setEditingSectionId,
    setSelectedSeatIds,
    setSelectedSectionIds,
    setSelectedOverlayId,
    setIsManageSectionsOpen,
    onNewSectionFromSeatEdit,
    onManageSectionsFromSeatEdit,
  } = forms;
  const { recordSnapshot, removeSeat, removeSection, updateSeat } = actions;
  const {
    onSectionEdit,
    onSeatShapeStyleChange,
    onSectionShapeStyleChange,
    onAlign,
    onShapeOverlayClick,
    onWheel,
    onMarkersInRect,
    handleSeatClickWithToolSwitch,
    handleKonvaSeatDragEnd,
    handleBatchSeatDragEnd,
    handleSeatShapeTransform,
    handleKonvaImageClick,
    handleDeselect,
    handleShapeDraw,
    handleResetZoomAndPan,
    handleZoomIn,
    handleZoomOut,
    handlePanDelta,
  } = callbacks;
  const {
    selectedShapeTool,
    displayedShapeOverlays,
    selectedOverlayId,
    showGrid,
    gridSize,
    zoomLevel,
    panOffset,
    isPlacingSeats,
    readOnly,
  } = toolbar;

  return (
    <>
      <SeatDesignToolbar
        shape={{
          selectedShapeType: selectedShapeTool,
          onShapeTypeSelect: readOnly ? () => {} : forms.setSelectedShapeTool,
        }}
        selection={{
          selectedSeat,
          selectedSection: null,
          selectedSeatCount: selectedSeatIds.length,
          selectedSectionCount: selectedSectionIds.length,
        }}
        actions={{
          onSeatEdit: (seat) => {
            setIsEditingSeat(true);
            seatEditForm.reset({
              section: seat.seat.section,
              sectionId: seat.seat.sectionId,
              row: seat.seat.row,
              seatNumber: seat.seat.seatNumber,
              seatType: seat.seat.seatType,
            });
          },
          onSeatView: forms.setViewingSeat,
          onSectionEdit,
          onSectionView: (section) => {
            setViewingSection(section);
            seatPlacementForm.setValue("section", section.name);
            setSelectedSectionMarker(null);
            handleResetZoomAndPan();
          },
          onSeatDelete: (seat) => removeSeat(seat.id),
          onSectionDelete: (section) => removeSection(section.id),
        }}
        styleActions={{
          onSeatShapeStyleChange,
          onSectionShapeStyleChange,
          onAlign,
        }}
        seatPlacement={
          selectedSeatIds.length <= 1
            ? {
                form: seatPlacementForm,
                uniqueSections: getUniqueSectionsUtil(
                  seats,
                  effectiveSectionsData,
                  sectionMarkers,
                  designMode,
                ),
                sectionsData: effectiveSectionsData,
                sectionSelectValue,
                onSectionSelectValueChange: setSectionSelectValue,
                onNewSection: () => {
                  setIsSectionFormOpen(true);
                  setEditingSectionId(null);
                  sectionForm.reset({ name: "" });
                },
                onManageSections: () => setIsManageSectionsOpen(true),
              }
            : undefined
        }
        seatEditControls={
          isEditingSeat && selectedSeat && !readOnly ? (
            <SeatEditControls
              form={seatEditForm}
              uniqueSections={getUniqueSectionsUtil(
                seats,
                effectiveSectionsData,
                sectionMarkers,
                designMode,
              )}
              sectionsData={effectiveSectionsData}
              sectionMarkers={sectionMarkers}
              designMode={designMode}
              onSave={(data) => {
                if (selectedSeat) {
                  recordSnapshot();
                  updateSeat(selectedSeat.id, { seat: data });
                  setIsEditingSeat(false);
                  seatEditForm.reset();
                }
              }}
              onCancel={() => {
                setIsEditingSeat(false);
                seatEditForm.reset();
              }}
              isUpdating={false}
              standalone
              onNewSection={onNewSectionFromSeatEdit}
              onManageSections={onManageSectionsFromSeatEdit}
            />
          ) : undefined
        }
        readOnly={readOnly}
      />

      <div
        ref={containerRef}
        className={`relative border rounded-lg overflow-hidden select-none w-full transition-colors ${
          mainImageUrl ? "bg-gray-100" : ""
        } ${isFullscreen ? "flex-1 min-h-0" : ""}`}
        style={{
          height: isFullscreen ? undefined : "600px",
          width: "100%",
          ...(isFullscreen ? { minHeight: 400 } : {}),
          backgroundColor: !mainImageUrl ? canvasBackgroundColor : undefined,
        }}
      >
        <SeatDesignerCanvas
          image={{
            imageUrl: mainImageUrl,
          }}
          container={{
            containerRef,
            dimensionsReady,
            containerDimensions,
            containerStyle: isFullscreen ? "flex" : "fixed",
          }}
          seats={{
            seats: displayedSeats,
            selectedSeatId: selectedSeat?.id ?? null,
            selectedSeatIds,
          }}
          view={{
            zoomLevel,
            panOffset,
            canvasBackgroundColor,
          }}
          toolbar={{
            isPlacingSeats,
            readOnly,
            selectedShapeTool,
            shapeOverlays: displayedShapeOverlays,
            selectedOverlayId,
            showGrid,
            gridSize,
          }}
          handlers={{
            onSeatClick: handleSeatClickWithToolSwitch,
            onSeatDragEnd: handleKonvaSeatDragEnd,
            onBatchSeatDragEnd: handleBatchSeatDragEnd,
            onSeatShapeTransform: handleSeatShapeTransform,
            onImageClick: handleKonvaImageClick,
            onDeselect: handleDeselect,
            onShapeDraw: handleShapeDraw,
            onShapeOverlayClick,
            onWheel,
            onPan: handlePanDelta,
            onMarkersInRect,
            onZoomIn: handleZoomIn,
            onZoomOut: handleZoomOut,
            onResetZoom: handleResetZoomAndPan,
          }}
        />

        <ZoomControls
          zoomLevel={zoomLevel}
          panOffset={panOffset}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoomAndPan}
        />
      </div>
    </>
  );
}
