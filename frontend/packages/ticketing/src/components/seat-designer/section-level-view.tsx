/**
 * Section Level View
 *
 * Renders the section-level design UI when not drilled into a section:
 * SectionCreationToolbar or ShapeToolbox + FloorPlanCanvas.
 * Used when designMode="section-level" and !viewingSection.
 */

import React from "react";
import Konva from "konva";
import {
  SectionCreationToolbar,
  ShapeToolbox,
  ZoomControls,
} from "./components";
import { FloorPlanCanvas } from "./floor-plan-canvas";
import type { SectionMarker } from "./types";
import type { PlacementShape } from "./types";

interface ShapeStyle {
  fillColor?: string;
  strokeColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
}

export interface SectionLevelViewProps {
  canvas: {
    containerRef: React.RefObject<HTMLDivElement>;
    dimensionsReady: boolean;
    containerDimensions: { width: number; height: number };
    isFullscreen: boolean;
    mainImageUrl?: string;
    canvasBackgroundColor: string;
  };
  data: {
    sectionMarkers: SectionMarker[];
    designMode: "section-level";
  };
  selection: {
    selectedSectionMarker: SectionMarker | null;
    selectedSectionIds: string[];
    anchorSeatId: string | null;
    anchorSectionId: string | null;
  };
  sectionCreation: {
    isSectionCreationPending: boolean;
    setIsSectionCreationPending: (pending: boolean) => void;
    editingSectionId: string | null;
    setEditingSectionId: (id: string | null) => void;
    placementShape: PlacementShape | null;
    setPlacementShape: React.Dispatch<React.SetStateAction<PlacementShape>>;
    pendingSectionCoordinates: { x: number; y: number } | null;
    setPendingSectionCoordinates: (
      coords: { x: number; y: number } | null,
    ) => void;
    setSelectedShapeTool: (
      tool: import("./types").PlacementShapeType | null,
    ) => void;
    setViewingSection: (section: SectionMarker | null) => void;
    setSelectedSectionMarker: (section: SectionMarker | null) => void;
    setSelectedSectionIds: (
      ids: string[] | ((prev: string[]) => string[]),
    ) => void;
    setSelectedOverlayId: (id: string | null) => void;
    seatPlacementForm: import("react-hook-form").UseFormReturn<
      import("./form-schemas").SeatFormData
    >;
  };
  actions: {
    recordSnapshot: () => void;
    addSection: (section: {
      name: string;
      x?: number;
      y?: number;
      shape?: PlacementShape;
    }) => void;
    updateSection: (id: string, updates: Partial<SectionMarker>) => void;
    removeSection: (id: string) => void;
  };
  callbacks: {
    onSectionShapeStyleChange: (
      sectionId: string,
      style: ShapeStyle,
    ) => void;
    onAlign: (alignment: string) => void;
    onShapeOverlayClick: (id: string) => void;
    onWheel: (
      e: Konva.KonvaEventObject<WheelEvent>,
      isSpacePressed: boolean,
    ) => void;
    onMarkersInRect: (seatIds: string[], sectionIds: string[]) => void;
    handleSeatClickWithToolSwitch?: (
      seat: import("./types").SeatMarker,
      event?: { shiftKey?: boolean },
    ) => void;
    handleSectionClickWithToolSwitch: (
      section: SectionMarker,
      event?: { shiftKey?: boolean },
    ) => void;
    handleKonvaSectionDragEnd: (
      sectionId: string,
      newX: number,
      newY: number,
    ) => void;
    handleKonvaSeatDragEnd: (seatId: string, x: number, y: number) => void;
    handleBatchSeatDragEnd: (
      updates: Array<{ id: string; x: number; y: number }>,
    ) => void;
    handleBatchSectionDragEnd: (
      updates: Array<{ id: string; x: number; y: number }>,
    ) => void;
    handleSeatShapeTransform: (
      seatId: string,
      shape: PlacementShape,
      position?: { x: number; y: number },
    ) => void;
    handleSectionShapeTransform: (
      sectionId: string,
      shape: PlacementShape,
      position?: { x: number; y: number },
    ) => void;
    handleKonvaImageClick: (
      e: Konva.KonvaEventObject<MouseEvent>,
      coords?: { x: number; y: number },
    ) => void;
    handleDeselect?: () => void;
    handleShapeDraw: (
      shape: PlacementShape,
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
      shape: PlacementShape;
      onClick?: () => void;
      onHover?: () => void;
      label?: string;
      isSelected?: boolean;
      isPlacement?: boolean;
    }>;
    selectedOverlayId: string | null;
    zoomLevel: number;
    panOffset: { x: number; y: number };
    isPlacingSections: boolean;
    readOnly: boolean;
  };
}

export function SectionLevelView({
  canvas,
  data,
  selection,
  sectionCreation,
  actions,
  callbacks,
  toolbar,
}: SectionLevelViewProps) {
  const {
    containerRef,
    dimensionsReady,
    containerDimensions,
    isFullscreen,
    mainImageUrl,
    canvasBackgroundColor,
  } = canvas;
  const { sectionMarkers, designMode } = data;
  const {
    selectedSectionMarker,
    selectedSectionIds,
    anchorSeatId,
    anchorSectionId,
  } = selection;
  const {
    isSectionCreationPending,
    setIsSectionCreationPending,
    editingSectionId,
    setEditingSectionId,
    placementShape,
    setPlacementShape,
    pendingSectionCoordinates,
    setPendingSectionCoordinates,
    setViewingSection,
    setSelectedSectionMarker,
    setSelectedShapeTool,
    seatPlacementForm,
  } = sectionCreation;
  const { recordSnapshot, addSection, updateSection, removeSection } = actions;
  const {
    onSectionShapeStyleChange,
    onAlign,
    onShapeOverlayClick,
    onWheel,
    onMarkersInRect,
    handleSeatClickWithToolSwitch,
    handleSectionClickWithToolSwitch,
    handleKonvaSectionDragEnd,
    handleKonvaSeatDragEnd,
    handleBatchSeatDragEnd,
    handleBatchSectionDragEnd,
    handleSeatShapeTransform,
    handleSectionShapeTransform,
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
    zoomLevel,
    panOffset,
    isPlacingSections,
    readOnly,
  } = toolbar;

  return (
    <>
      {isSectionCreationPending ? (
        <SectionCreationToolbar
          initialName={
            editingSectionId
              ? sectionMarkers.find((s) => s.id === editingSectionId)?.name ||
                ""
              : ""
          }
          isEditing={!!editingSectionId}
          selectedShapeType={selectedShapeTool}
          onShapeTypeSelect={setSelectedShapeTool}
          onSave={(name) => {
            if (editingSectionId) {
              const section = sectionMarkers.find(
                (s) => s.id === editingSectionId,
              );
              if (section) {
                updateSection(editingSectionId, {
                  name,
                  shape: (placementShape ?? section.shape) ?? undefined,
                });
              }
            } else {
              addSection({
                name,
                x:
                  designMode === "section-level"
                    ? (pendingSectionCoordinates?.x ?? 50)
                    : undefined,
                y:
                  designMode === "section-level"
                    ? (pendingSectionCoordinates?.y ?? 50)
                    : undefined,
                shape:
                  designMode === "section-level"
                    ? (placementShape ?? undefined)
                    : undefined,
              });
            }
            setIsSectionCreationPending(false);
            setPendingSectionCoordinates(null);
            setEditingSectionId(null);
          }}
          onCancel={() => {
            setIsSectionCreationPending(false);
            setPendingSectionCoordinates(null);
            setEditingSectionId(null);
          }}
        />
      ) : (
        <ShapeToolbox
          selectedShapeType={selectedShapeTool}
          onShapeTypeSelect={readOnly ? () => {} : setSelectedShapeTool}
          selectedSeat={null}
          selectedSection={selectedSectionMarker}
          onSeatEdit={() => {}}
          onSeatView={() => {}}
          onSectionEdit={(section) => {
            setEditingSectionId(section.id);
            setIsSectionCreationPending(true);
            if (section.shape) {
              setPlacementShape(section.shape);
              setSelectedShapeTool(section.shape.type);
            }
          }}
          onSectionView={(section) => {
            setViewingSection(section);
            seatPlacementForm.setValue("section", section.name);
            setSelectedSectionMarker(null);
            handleResetZoomAndPan();
          }}
          onSeatDelete={() => {}}
          onSectionDelete={(section) => removeSection(section.id)}
          onSeatShapeStyleChange={() => {}}
          onSectionShapeStyleChange={onSectionShapeStyleChange}
          onAlign={onAlign}
          selectedSeatCount={0}
          selectedSectionCount={selectedSectionIds.length}
          readOnly={readOnly}
          level="section"
        />
      )}

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
        <FloorPlanCanvas
          imageUrl={mainImageUrl}
          canvasBackgroundColor={canvasBackgroundColor}
          seats={[]}
          sections={sectionMarkers}
          selectedSeatId={null}
          selectedSectionId={selectedSectionMarker?.id || null}
          selectedSeatIds={[]}
          selectedSectionIds={selectedSectionIds}
          anchorSeatId={anchorSeatId}
          anchorSectionId={anchorSectionId}
          onMarkersInRect={onMarkersInRect}
          isPlacingSeats={false}
          isPlacingSections={isPlacingSections}
          readOnly={readOnly}
          zoomLevel={zoomLevel}
          panOffset={panOffset}
          onSeatClick={handleSeatClickWithToolSwitch ?? (() => {})}
          onSectionClick={handleSectionClickWithToolSwitch}
          onSectionDoubleClick={(section) => {
            setViewingSection(section);
            seatPlacementForm.setValue("section", section.name);
            setSelectedSectionMarker(null);
            handleResetZoomAndPan();
          }}
          onSectionDragEnd={handleKonvaSectionDragEnd}
          onSeatDragEnd={handleKonvaSeatDragEnd}
          onBatchSeatDragEnd={handleBatchSeatDragEnd}
          onBatchSectionDragEnd={handleBatchSectionDragEnd}
          onSeatShapeTransform={handleSeatShapeTransform}
          onSectionShapeTransform={handleSectionShapeTransform}
          onImageClick={handleKonvaImageClick}
          onDeselect={handleDeselect}
          onShapeDraw={handleShapeDraw}
          onShapeOverlayClick={onShapeOverlayClick}
          onWheel={onWheel}
          onPan={handlePanDelta}
          containerWidth={containerDimensions.width}
          containerHeight={containerDimensions.height}
          designMode={designMode}
          selectedShapeTool={selectedShapeTool}
          selectedOverlayId={selectedOverlayId}
          shapeOverlays={displayedShapeOverlays}
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
