/**
 * Section Detail View Component
 *
 * View for editing seats within a specific section in section-level design mode
 */

import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
} from "@truths/ui";
import {
  Trash2,
  MoreVertical,
  Image as ImageIcon,
  List,
  ArrowLeft,
  ScanSearch,
  Minimize,
  Maximize,
  Palette,
  Layers,
  BrushCleaning,
  Undo2,
  Redo2,
  RefreshCw,
} from "lucide-react";
import { DatasheetView, SeatDesignerCanvas, SeatDesignToolbar } from "./index";
import type { SectionMarker, SeatMarker } from "../types";
import type { PlacementShape } from "../types";
import { PlacementShapeType } from "../types";
import { Fragment, useMemo, useState } from "react";

export type SectionDetailAlign =
  | "left"
  | "center"
  | "right"
  | "top"
  | "middle"
  | "bottom"
  | "space-between-h"
  | "space-between-v"
  | "space-between-both"
  | "same-width"
  | "same-height";

export interface SectionDetailViewProps {
  section: {
    viewingSection: SectionMarker;
    uniqueSections: string[];
    sectionsData?: Array<{ id: string; name: string }>;
    sectionSelectValue: string;
    onSectionSelectValueChange: (value: string) => void;
  };
  canvas: {
    containerRef: React.RefObject<HTMLDivElement>;
    dimensionsReady: boolean;
    containerDimensions: { width: number; height: number };
    zoomLevel: number;
    panOffset: { x: number; y: number };
    /** Canvas background color when no section image (image has priority). */
    canvasBackgroundColor?: string;
    onCanvasBackgroundColorChange?: (color: string) => void;
    /** Marker fill transparency for this section (0.0 to 1.0). */
    markerFillTransparency?: number;
    onMarkerFillTransparencyChange?: (transparency: number) => void;
    showGrid?: boolean;
    gridSize?: number;
  };
  selection: {
    displayedSeats: SeatMarker[];
    selectedSeat: SeatMarker | null;
    selectedSeatIds?: string[];
    onSelectSeatIds?: (ids: string[]) => void;
  };
  forms: { seatPlacementForm: any };
  seats: SeatMarker[];
  handlers: {
    onBack: () => void;
    onSave: () => void;
    onClearSectionSeats: () => void;
    onSectionImageSelect: (
      sectionId: string,
      e: React.ChangeEvent<HTMLInputElement>,
    ) => void;
    onRemoveSectionImage?: (sectionId: string) => void | Promise<void>;
    onSeatClick: (seat: SeatMarker) => void;
    onSeatDragEnd: (seatId: string, newX: number, newY: number) => void;
    onBatchSeatDragEnd?: (
      updates: Array<{ id: string; x: number; y: number }>,
    ) => void;
    onSeatShapeTransform?: (
      seatId: string,
      shape: PlacementShape,
      position?: { x: number; y: number },
    ) => void;
    onSeatShapeStyleChange?: (
      seatId: string,
      style: { fillColor?: string; strokeColor?: string },
    ) => void;
    onImageClick: (e: any, coords?: { x: number; y: number }) => void;
    onDeselect?: () => void;
    onWheel: (e: any, isSpacePressed: boolean) => void;
    onPan: (delta: { x: number; y: number }) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom: () => void;
    onNewSection: () => void;
    onDeleteSeat: (seat: SeatMarker) => void;
    onSetViewingSeat: (seat: SeatMarker | null) => void;
    onEditSeat?: (seat: SeatMarker) => void;
    onSetSelectedSeat: (seat: SeatMarker | null) => void;
    seatEditFormReset: (data: any) => void;
    onShapeToolSelect: (tool: PlacementShapeType | null) => void;
    onShapeDraw?: (shape: PlacementShape, x: number, y: number) => void;
    onShapeOverlayClick: (overlayId: string) => void;
    onDetectSeats?: () => void;
    onMarkersInRect?: (seatIds: string[], sectionIds: string[]) => void;
    onAlign?: (alignment: SectionDetailAlign) => void;
  };
  design: {
    placementShape: PlacementShape;
    onPlacementShapeChange: (shape: PlacementShape) => void;
    selectedShapeTool?: PlacementShapeType | null;
    shapeOverlays?: any[];
    selectedOverlayId?: string | null;
  };
  state: {
    saveSeatsMutationPending: boolean;
    isPlacingSeats: boolean;
    isUploadingImage: boolean;
    isDetectingSeats?: boolean;
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    isDirty?: boolean;
    onRefresh?: () => void | Promise<void>;
    isRefreshing?: boolean;
  };
  display?: {
    className?: string;
    readOnly?: boolean;
    seatEditControls?: React.ReactNode;
  };
}

export function SectionDetailView({
  section: {
    viewingSection,
    uniqueSections,
    sectionsData,
    sectionSelectValue,
    onSectionSelectValueChange,
  },
  canvas: {
    containerRef,
    dimensionsReady,
    containerDimensions,
    zoomLevel,
    panOffset,
    canvasBackgroundColor = "#e5e7eb",
    onCanvasBackgroundColorChange,
    markerFillTransparency = 1.0,
    onMarkerFillTransparencyChange,
    showGrid = false,
    gridSize = 5,
  },
  selection: {
    displayedSeats,
    selectedSeat,
    selectedSeatIds = [],
    onSelectSeatIds,
  },
  forms: { seatPlacementForm },
  seats,
  handlers: {
    onBack,
    onSave,
    onClearSectionSeats,
    onSectionImageSelect,
    onRemoveSectionImage,
    onSeatClick,
    onSeatDragEnd,
    onBatchSeatDragEnd,
    onSeatShapeTransform,
    onSeatShapeStyleChange,
    onImageClick,
    onDeselect,
    onWheel,
    onPan,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onNewSection,
    onDeleteSeat,
    onSetViewingSeat,
    onEditSeat,
    onSetSelectedSeat,
    seatEditFormReset,
    onShapeToolSelect,
    onShapeDraw,
    onShapeOverlayClick,
    onDetectSeats,
    onMarkersInRect,
    onAlign,
  },
  design: {
    placementShape,
    onPlacementShapeChange,
    selectedShapeTool,
    shapeOverlays,
    selectedOverlayId,
  },
  state: {
    saveSeatsMutationPending,
    isPlacingSeats,
    isUploadingImage,
    isDetectingSeats = false,
    isFullscreen = false,
    onToggleFullscreen,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    isDirty = false,
    onRefresh,
    isRefreshing = false,
  },
  display: { className, readOnly = false, seatEditControls } = {},
}: SectionDetailViewProps) {
  const [isDatasheetOpen, setIsDatasheetOpen] = useState(false);
  const effectiveCanvasColor =
    viewingSection.canvasBackgroundColor ?? canvasBackgroundColor ?? "#e5e7eb";
  const innerClassName = isFullscreen
    ? "flex flex-col flex-1 min-h-0 p-6 space-y-4"
    : "p-6 space-y-4";

  const dropdownMenuItems: React.ReactNode[] = useMemo(() => {
    return [
      <DropdownMenuItem onClick={onClearSectionSeats}>
        <BrushCleaning className="h-4 w-4 mr-2" />
        Clear All Placements
      </DropdownMenuItem>,
      <DropdownMenuSeparator />,
      !viewingSection.imageUrl && (
        <Label
          htmlFor={`add-section-image-${viewingSection.id}`}
          className="cursor-pointer"
        >
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
            <div>
              <ImageIcon className="h-4 w-4 mr-2" />
              Add floor plan image
              <Input
                id={`add-section-image-${viewingSection.id}`}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  onSectionImageSelect(viewingSection.id, e);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </div>
          </DropdownMenuItem>
        </Label>
      ),
      viewingSection.imageUrl && onSectionImageSelect && (
        <Label
          htmlFor={`change-section-image-${viewingSection.id}`}
          className="cursor-pointer"
        >
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
            <div>
              <ImageIcon className="h-4 w-4 mr-2" />
              Change Image
              <Input
                id={`change-section-image-${viewingSection.id}`}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  onSectionImageSelect(viewingSection.id, e);
                  e.target.value = ""; // Reset input
                }}
                className="hidden"
              />
            </div>
          </DropdownMenuItem>
        </Label>
      ),
      onCanvasBackgroundColorChange && !viewingSection.imageUrl && (
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
          <label className="flex cursor-pointer items-center gap-2 px-2 py-1.5">
            <Palette className="h-4 w-4 shrink-0" />
            <span className="flex-1">Canvas background color</span>
            <input
              type="color"
              aria-label="Canvas background color"
              value={effectiveCanvasColor}
              onChange={(e) => onCanvasBackgroundColorChange(e.target.value)}
              className="h-6 w-8 cursor-pointer rounded border border-input"
            />
          </label>
        </DropdownMenuItem>
      ),
      onMarkerFillTransparencyChange && (
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
          <label className="flex cursor-pointer items-center gap-2 px-2 py-1.5">
            <Layers className="h-4 w-4 shrink-0" />
            <span className="flex-1">Transparency</span>
            <input
              type="range"
              min="0"
              max="100"
              value={(markerFillTransparency ?? 1.0) * 100}
              onChange={(e) =>
                onMarkerFillTransparencyChange(parseInt(e.target.value) / 100)
              }
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer min-w-0"
              title="Adjust marker fill transparency for this section"
            />
            <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
              {Math.round((markerFillTransparency ?? 1.0) * 100)}%
            </span>
          </label>
        </DropdownMenuItem>
      ),
      viewingSection.imageUrl && onRemoveSectionImage && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onRemoveSectionImage(viewingSection.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove Image
          </DropdownMenuItem>
        </>
      ),
    ];
  }, [
    onClearSectionSeats,
    markerFillTransparency,
    onMarkerFillTransparencyChange,
  ]);

  const canvasProps = {
    image: {
      imageUrl: viewingSection.imageUrl ?? "",
      showImageUpload: false,
      imageUploadId: `section-image-${viewingSection.id}`,
      imageUploadLabel: `Upload Floor Plan Image for ${viewingSection.name}`,
      onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) =>
        onSectionImageSelect(viewingSection.id, e),
      isUploadingImage,
    },
    container: {
      containerRef,
      dimensionsReady,
      containerDimensions,
      containerStyle: "flex" as const,
    },
    seats: {
      seats: displayedSeats,
      selectedSeatId: selectedSeat?.id ?? null,
      selectedSeatIds,
    },
    view: {
      zoomLevel,
      panOffset,
      canvasBackgroundColor: effectiveCanvasColor,
    },
    toolbar: {
      isPlacingSeats,
      readOnly,
      selectedShapeTool: selectedShapeTool ?? null,
      shapeOverlays,
      selectedOverlayId,
      showGrid,
      gridSize,
    },
    handlers: {
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
    },
  };

  return (
    <Card className={className}>
      <div className={innerClassName}>
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0"
              title="Back to Main Floor Plan"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              Section: {viewingSection.name}
            </h3>
          </div>
          {/* Toolbar: same order as DesignerHeader (List | Detect | Save | Fullscreen | color | ⋮) */}
          <div className="flex items-center gap-1">
            {/* Refresh Button */}
            {onRefresh && (
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={isRefreshing}
                size="sm"
                className="h-7 w-7 p-0"
                title="Refresh data from server"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>
            )}
            {!isFullscreen && (
              <Button
                onClick={() => setIsDatasheetOpen(true)}
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                title="View seat list"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDetectSeats && viewingSection.imageUrl && !readOnly && (
              <Button
                variant="outline"
                onClick={onDetectSeats}
                disabled={isDetectingSeats}
                size="sm"
                className="h-7 px-2"
                title="Detect seats from section image (AI)"
              >
                <ScanSearch className="h-3.5 w-3.5 mr-1" />
                {isDetectingSeats ? "Detecting…" : "Detect seats"}
              </Button>
            )}
            {!readOnly && onUndo && onRedo && (
              <>
                <Button
                  variant="outline"
                  onClick={onUndo}
                  disabled={!canUndo}
                  size="sm"
                  className="h-7 w-7 p-0"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={onRedo}
                  disabled={!canRedo}
                  size="sm"
                  className="h-7 w-7 p-0"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Redo2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            {onToggleFullscreen && (
              <Button
                variant="outline"
                onClick={onToggleFullscreen}
                size="sm"
                className="h-7 w-7 p-0"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="h-3.5 w-3.5" />
                ) : (
                  <Maximize className="h-3.5 w-3.5" />
                )}
              </Button>
            )}

            {!readOnly && dropdownMenuItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {dropdownMenuItems.map((item, index) => (
                    <Fragment key={index}>{item}</Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Shape Toolbox with compact seat placement controls */}
        {onShapeToolSelect && (
          <div className="shrink-0">
            <SeatDesignToolbar
              shape={{
                selectedShapeType: selectedShapeTool || null,
                onShapeTypeSelect: onShapeToolSelect,
              }}
              selection={{
                selectedSeat,
                selectedSection: undefined,
                selectedSeatCount: selectedSeatIds.length,
                selectedSectionCount: 0,
              }}
              actions={{
                onSeatView: (seat) => onSetViewingSeat(seat),
                onSeatEdit: (seat) => onEditSeat?.(seat),
                onSeatDelete: onDeleteSeat,
              }}
              styleActions={{
                onSeatShapeStyleChange,
                onAlign,
              }}
              seatPlacement={
                selectedSeatIds.length <= 1
                  ? {
                      form: seatPlacementForm,
                      uniqueSections,
                      sectionsData,
                      sectionSelectValue,
                      onSectionSelectValueChange,
                      viewingSection,
                      onNewSection,
                    }
                  : undefined
              }
              seatEditControls={seatEditControls}
              readOnly={readOnly}
            />
          </div>
        )}

        {/* Seat Design Canvas - same as seat-level: always show canvas; no image = canvas background color, image = image (add/change/remove via dropdown) */}
        <div
          className={
            isFullscreen ? "flex-1 min-h-0 flex flex-col" : "space-y-4"
          }
        >
          <SeatDesignerCanvas
            image={canvasProps.image}
            container={canvasProps.container}
            seats={canvasProps.seats}
            view={canvasProps.view}
            toolbar={canvasProps.toolbar}
            handlers={canvasProps.handlers}
          />
        </div>
      </div>

      {/* Seat List Datasheet */}
      <DatasheetView
        sheet={{ isOpen: isDatasheetOpen, onOpenChange: setIsDatasheetOpen }}
        data={{
          viewingSection,
          designMode: "seat-level",
          displayedSeats,
          seats,
          sectionMarkers: [],
        }}
        selection={{ selectedSeat, selectedSectionMarker: null }}
        forms={{
          isSectionFormOpen: false,
          editingSectionId: null,
          sectionForm: {} as any,
          createSectionMutationPending: false,
          updateSectionMutationPending: false,
        }}
        handlers={{
          onSeatClick,
          onDeleteSeat,
          onOpenNewSectionForm: () => {},
          onCancelSectionForm: () => {},
          onSaveSectionForm: () => {},
          onSectionMarkerClick: () => {},
          onOpenSectionDetail: () => {},
          onEditSectionFromSheet: () => {},
          onDeleteSection: () => {},
          onSetViewingSeat,
          onEditSeat,
          onSetSelectedSeat,
          onSetIsDatasheetOpen: setIsDatasheetOpen,
          seatEditFormReset,
        }}
        display={{ readOnly, isPlacingSeats }}
      />
    </Card>
  );
}
