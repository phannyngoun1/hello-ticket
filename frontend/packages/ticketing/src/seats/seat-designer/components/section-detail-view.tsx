/**
 * Section Detail View Component
 * 
 * View for editing seats within a specific section in section-level design mode
 */

import { Button, Card, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Input, Label } from "@truths/ui";
import { Save, Trash2, X, MoreVertical, Image as ImageIcon } from "lucide-react";
import { LayoutCanvas } from "../layout-canvas";
import { ImageUploadCard, SeatPlacementControls, ZoomControls } from "./index";
import type { SectionMarker, SeatMarker } from "../types";

export interface SectionDetailViewProps {
  viewingSection: SectionMarker;
  className?: string;
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
  onSectionImageSelect: (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onSeatClick: (seat: SeatMarker) => void;
  onSeatDragEnd: (seatId: string, newX: number, newY: number) => void;
  onImageClick: (e: any, coords?: { x: number; y: number }) => void;
  onWheel: (e: any, isSpacePressed: boolean) => void;
  onPan: (delta: { x: number; y: number }) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onNewSection: () => void;
  saveSeatsMutationPending: boolean;
}

export function SectionDetailView({
  viewingSection,
  className,
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
  onImageClick,
  onWheel,
  onPan,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onNewSection,
  saveSeatsMutationPending,
}: SectionDetailViewProps) {
  return (
    <Card className={className}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mb-2"
            >
              <X className="h-4 w-4 mr-2" />
              Back to Main Floor Plan
            </Button>
            <h3 className="text-lg font-semibold">
              Section: {viewingSection.name}
            </h3>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onSave}
              disabled={saveSeatsMutationPending}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
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
          </div>
        </div>

        {/* Section Image Upload */}
        {!viewingSection.imageUrl && (
          <ImageUploadCard
            id={`section-image-${viewingSection.id}`}
            label={`Upload Floor Plan Image for ${viewingSection.name}`}
            isUploading={isUploadingImage}
            onFileSelect={(e) => onSectionImageSelect(viewingSection.id, e)}
          />
        )}

        {/* Section Image with Seat Markers */}
        {viewingSection.imageUrl && (
          <div className="space-y-4">
            {/* Seat Placement Controls Panel - On Top */}
            <SeatPlacementControls
              form={seatPlacementForm}
              uniqueSections={uniqueSections}
              sectionsData={sectionsData}
              sectionSelectValue={sectionSelectValue}
              onSectionSelectValueChange={onSectionSelectValueChange}
              viewingSection={viewingSection}
              onNewSection={onNewSection}
            />

            {/* Canvas Container */}
            <div
              ref={containerRef}
              className="relative border rounded-lg overflow-hidden bg-gray-100 flex-1"
              style={{
                minHeight: "600px",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              {dimensionsReady ? (
                <LayoutCanvas
                  imageUrl={viewingSection.imageUrl}
                  seats={displayedSeats}
                  selectedSeatId={selectedSeat?.id || null}
                  isPlacingSeats={isPlacingSeats}
                  isPlacingSections={false}
                  zoomLevel={zoomLevel}
                  panOffset={panOffset}
                  onSeatClick={onSeatClick}
                  onSeatDragEnd={onSeatDragEnd}
                  onImageClick={onImageClick}
                  onWheel={onWheel}
                  onPan={onPan}
                  containerWidth={containerDimensions.width}
                  containerHeight={containerDimensions.height}
                  venueType="small"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full py-12 text-muted-foreground">
                  Initializing canvas...
                </div>
              )}
              {/* Zoom Controls */}
              <ZoomControls
                zoomLevel={zoomLevel}
                panOffset={panOffset}
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onResetZoom={onResetZoom}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

