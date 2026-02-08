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
  Save,
  Trash2,
  MoreVertical,
  Image as ImageIcon,
  List,
  ArrowLeft,
  ScanSearch,
} from "lucide-react";
import {
  DatasheetView,
  SeatDesignCanvas,
  SeatDesignToolbar,
} from "./index";
import type { SectionMarker, SeatMarker } from "../types";
import type { PlacementShape } from "../types";
import { PlacementShapeType } from "../types";
import { useState } from "react";

export interface SectionDetailViewProps {
  viewingSection: SectionMarker;
  className?: string;
  readOnly?: boolean;
  displayedSeats: SeatMarker[];
  selectedSeat: SeatMarker | null;
  seatPlacementForm: any; // UseFormReturn<SeatFormData>
  uniqueSections: string[];
  sectionsData?: Array<{ id: string; name: string }>;
  sectionSelectValue: string;
  onSectionSelectValueChange: (value: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  dimensionsReady: boolean;
  containerDimensions: { width: number; height: number };
  zoomLevel: number;
  panOffset: { x: number; y: number };
  isPlacingSeats: boolean;
  isUploadingImage: boolean;
  onBack: () => void;
  onSave: () => void;
  onClearSectionSeats: () => void;
  onSectionImageSelect: (
    sectionId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onSeatClick: (seat: SeatMarker) => void;
  onSeatDragEnd: (seatId: string, newX: number, newY: number) => void;
  onSeatShapeTransform?: (seatId: string, shape: PlacementShape) => void;
  onSeatShapeStyleChange?: (
    seatId: string,
    style: { fillColor?: string; strokeColor?: string }
  ) => void;
  onImageClick: (e: any, coords?: { x: number; y: number }) => void;
  onDeselect?: () => void;
  onWheel: (e: any, isSpacePressed: boolean) => void;
  onPan: (delta: { x: number; y: number }) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onNewSection: () => void;
  saveSeatsMutationPending: boolean;
  // Props for DatasheetView
  seats: SeatMarker[];
  onDeleteSeat: (seat: SeatMarker) => void;
  onSetViewingSeat: (seat: SeatMarker | null) => void;
  onEditSeat?: (seat: SeatMarker) => void;
  onSetSelectedSeat: (seat: SeatMarker | null) => void;
  seatEditFormReset: (data: any) => void;
  placementShape: PlacementShape;
  onPlacementShapeChange: (shape: PlacementShape) => void;
  selectedShapeTool?: PlacementShapeType | null;
  onShapeToolSelect: (tool: PlacementShapeType | null) => void;
  onShapeDraw?: (shape: PlacementShape, x: number, y: number) => void;
  shapeOverlays?: any[];
  selectedOverlayId?: string | null;
  onShapeOverlayClick: (overlayId: string) => void;
  onDetectSeats?: () => void;
  isDetectingSeats?: boolean;
  /** Inline seat edit controls - when provided and selectedSeat, replaces marker name + View/Edit/Delete */
  seatEditControls?: React.ReactNode;
}

export function SectionDetailView({
  viewingSection,
  className,
  readOnly = false,
  displayedSeats,
  selectedSeat,
  seatPlacementForm,
  uniqueSections,
  sectionsData,
  sectionSelectValue,
  onSectionSelectValueChange,
  containerRef,
  dimensionsReady,
  containerDimensions,
  zoomLevel,
  panOffset,
  isPlacingSeats,
  isUploadingImage,
  onBack,
  onSave,
  onClearSectionSeats,
  onSectionImageSelect,
  onSeatClick,
  onSeatDragEnd,
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
  saveSeatsMutationPending,
  seats,
  onDeleteSeat,
  onSetViewingSeat,
  onEditSeat,
  onSetSelectedSeat,
  seatEditFormReset,
  selectedShapeTool,
  onShapeToolSelect,
  onShapeDraw,
  shapeOverlays,
  selectedOverlayId,
  onShapeOverlayClick,
  onDetectSeats,
  isDetectingSeats = false,
  seatEditControls,
}: SectionDetailViewProps) {
  const [isDatasheetOpen, setIsDatasheetOpen] = useState(false);
  return (
    <Card className={className}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
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
          <div className="flex gap-1">
            <Button
              onClick={() => setIsDatasheetOpen(true)}
              variant="outline"
              size="sm"
              className="h-7 px-2"
            >
              <List className="h-3.5 w-3.5 mr-1" />
              Seat List ({displayedSeats.length})
            </Button>
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
            {!readOnly && (
              <Button
                onClick={onSave}
                disabled={saveSeatsMutationPending}
                size="sm"
                className="h-7 px-2"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                Save
              </Button>
            )}
            {!readOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onClearSectionSeats}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Seats
                  </DropdownMenuItem>
                  {viewingSection.imageUrl && (
                    <>
                      <DropdownMenuSeparator />
                      <Label
                        htmlFor={`change-section-image-${viewingSection.id}`}
                        className="cursor-pointer"
                      >
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          asChild
                        >
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
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Shape Toolbox with compact seat placement controls */}
        {onShapeToolSelect && (
          <SeatDesignToolbar
            selectedShapeType={selectedShapeTool || null}
            onShapeTypeSelect={onShapeToolSelect}
            selectedSeat={selectedSeat}
            onSeatView={(seat) => {
              onSetViewingSeat(seat);
            }}
            onSeatEdit={(seat) => {
              onEditSeat?.(seat);
            }}
            onSeatDelete={onDeleteSeat}
            onSeatShapeStyleChange={onSeatShapeStyleChange}
            seatPlacement={{
              form: seatPlacementForm,
              uniqueSections,
              sectionsData,
              sectionSelectValue,
              onSectionSelectValueChange,
              viewingSection,
              onNewSection,
            }}
            seatEditControls={seatEditControls}
            readOnly={readOnly}
          />
        )}

        {/* Section Image Upload + Seat Design Canvas */}
        <div className="space-y-4">
          <SeatDesignCanvas
            imageUrl={viewingSection.imageUrl ?? ""}
            showImageUpload
            imageUploadId={`section-image-${viewingSection.id}`}
            imageUploadLabel={`Upload Floor Plan Image for ${viewingSection.name}`}
            onImageUpload={(e) => onSectionImageSelect(viewingSection.id, e)}
            isUploadingImage={isUploadingImage}
            containerRef={containerRef}
            dimensionsReady={dimensionsReady}
            containerDimensions={containerDimensions}
            containerStyle="flex"
            seats={displayedSeats}
            selectedSeatId={selectedSeat?.id ?? null}
            isPlacingSeats={isPlacingSeats}
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
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onResetZoom={onResetZoom}
            selectedShapeTool={selectedShapeTool ?? null}
            shapeOverlays={shapeOverlays}
            selectedOverlayId={selectedOverlayId}
          />
        </div>
      </div>

      {/* Seat List Datasheet */}
      <DatasheetView
        isOpen={isDatasheetOpen}
        onOpenChange={setIsDatasheetOpen}
        readOnly={readOnly}
        viewingSection={viewingSection}
        venueType="small"
        displayedSeats={displayedSeats}
        seats={seats}
        sectionMarkers={[]}
        selectedSeat={selectedSeat}
        isPlacingSeats={isPlacingSeats}
        isSectionFormOpen={false}
        editingSectionId={null}
        sectionForm={{} as any}
        selectedSectionMarker={null}
        createSectionMutationPending={false}
        updateSectionMutationPending={false}
        onSeatClick={onSeatClick}
        onDeleteSeat={onDeleteSeat}
        onOpenNewSectionForm={() => {}}
        onCancelSectionForm={() => {}}
        onSaveSectionForm={() => {}}
        onSectionMarkerClick={() => {}}
        onOpenSectionDetail={() => {}}
        onEditSectionFromSheet={() => {}}
        onDeleteSection={() => {}}
        onSetViewingSeat={onSetViewingSeat}
        onEditSeat={onEditSeat}
        onSetSelectedSeat={onSetSelectedSeat}
        onSetIsDatasheetOpen={setIsDatasheetOpen}
        seatEditFormReset={seatEditFormReset}
      />
    </Card>
  );
}
