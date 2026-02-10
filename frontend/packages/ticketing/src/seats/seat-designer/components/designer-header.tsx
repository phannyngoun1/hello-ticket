import React from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Label,
  Input,
} from "@truths/ui";
import {
  List,
  Save,
  Minimize,
  Maximize,
  MoreVertical,
  Trash2,
  Image as ImageIcon,
  ScanSearch,
  Palette,
} from "lucide-react";
import { SectionMarker, SeatMarker } from "../types";

export interface DesignerHeaderProps {
  layoutName?: string;
  isLoading: boolean;
  seatsError: unknown;
  venueType: "small" | "large";
  sectionMarkers: SectionMarker[];
  seats: SeatMarker[];
  viewingSection: SectionMarker | null;
  displayedSeats: SeatMarker[];
  onToggleDatasheet: () => void;
  readOnly: boolean;
  onSave: () => void;
  isSaving: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  mainImageUrl?: string;
  isPlacingSeats: boolean;
  isPlacingSections: boolean;
  onClearAllPlacements: () => void;
  onMainImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Called when user removes the floor plan image (switch to simple floor) */
  onRemoveImage?: () => void | Promise<void>;
  onDetectSections?: () => void;
  isDetectingSections?: boolean;
  onDetectSeats?: () => void;
  isDetectingSeats?: boolean;
  /** Canvas background color when no image; shown only when !mainImageUrl */
  canvasBackgroundColor?: string;
  /** Called when user changes canvas background color; only relevant when no image */
  onCanvasBackgroundColorChange?: (color: string) => void;
}

export function DesignerHeader({
  layoutName,
  isLoading,
  seatsError,
  venueType,
  sectionMarkers,
  seats,
  viewingSection,
  displayedSeats,
  onToggleDatasheet,
  readOnly,
  onSave,
  isSaving,
  isFullscreen,
  onToggleFullscreen,
  mainImageUrl,
  isPlacingSeats,
  isPlacingSections,
  onClearAllPlacements,
  onMainImageSelect,
  onRemoveImage,
  onDetectSections,
  isDetectingSections = false,
  onDetectSeats,
  isDetectingSeats = false,
  canvasBackgroundColor = "#e5e7eb",
  onCanvasBackgroundColorChange,
}: DesignerHeaderProps) {
  // Logic for showing datasheet toggle (hidden in full screen to maximize canvas focus)
  const showDatasheetButton =
    !isFullscreen &&
    ((venueType === "large" && sectionMarkers.length > 0) ||
      (venueType === "small" && seats.length > 0) ||
      (viewingSection && displayedSeats.length > 0));

  // Logic for showing dropdown menu (when we have image)
  const showImageMenu =
    mainImageUrl &&
    !readOnly &&
    (isPlacingSeats || (venueType === "large" && isPlacingSections));

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">
          {layoutName ? `Designer - ${layoutName}` : "Seat Designer"}
        </h3>
        {isLoading && (
          <span className="text-xs text-muted-foreground">
            Loading seats...
          </span>
        )}
        {Boolean(seatsError) && (
          <span className="text-xs text-destructive">Error loading seats</span>
        )}
      </div>
      <div className="flex gap-1">
        {/* Datasheet Toggle Button */}
        {showDatasheetButton && (
          <Button
            variant="outline"
            onClick={onToggleDatasheet}
            size="sm"
            className="h-7 w-7 p-0"
            title="View Datasheet"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        )}
        {onDetectSections && (
          <Button
            variant="outline"
            onClick={onDetectSections}
            disabled={isDetectingSections}
            size="sm"
            className="h-7 px-2"
            title="Detect sections from image (AI)"
          >
            <ScanSearch className="h-3.5 w-3.5 mr-1" />
            {isDetectingSections ? "Detecting…" : "Detect sections"}
          </Button>
        )}
        {onDetectSeats && (
          <Button
            variant="outline"
            onClick={onDetectSeats}
            disabled={isDetectingSeats}
            size="sm"
            className="h-7 px-2"
            title="Detect seats from image (AI)"
          >
            <ScanSearch className="h-3.5 w-3.5 mr-1" />
            {isDetectingSeats ? "Detecting…" : "Detect seats"}
          </Button>
        )}
        {!readOnly && (
          <Button
            onClick={onSave}
            disabled={isSaving}
            size="sm"
            className="h-7 px-2"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>
        )}
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
        {/* Dropdown: no image = canvas color + add image; with image = clear / change / remove */}
        {!readOnly &&
          ((!mainImageUrl && onCanvasBackgroundColorChange) ||
            showImageMenu) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!mainImageUrl ? (
                  <>
                    {onMainImageSelect && (
                      <Label
                        htmlFor="add-floor-plan-image"
                        className="cursor-pointer"
                      >
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          asChild
                        >
                          <div>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Add floor plan image
                            <Input
                              id="add-floor-plan-image"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                onMainImageSelect(e);
                                e.target.value = "";
                              }}
                              className="hidden"
                            />
                          </div>
                        </DropdownMenuItem>
                      </Label>
                    )}
                    {onCanvasBackgroundColorChange && <DropdownMenuSeparator />}
                    {onCanvasBackgroundColorChange && (
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        asChild
                      >
                        <label className="flex cursor-pointer items-center gap-2 px-2 py-1.5">
                          <Palette className="h-4 w-4 shrink-0" />
                          <span className="flex-1">
                            Canvas background color
                          </span>
                          <input
                            type="color"
                            aria-label="Canvas background color"
                            value={canvasBackgroundColor}
                            onChange={(e) =>
                              onCanvasBackgroundColorChange(e.target.value)
                            }
                            className="h-6 w-8 cursor-pointer rounded border border-input"
                          />
                        </label>
                      </DropdownMenuItem>
                    )}
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={onClearAllPlacements}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Placements
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <Label
                      htmlFor="change-main-image"
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
                            id="change-main-image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              onMainImageSelect(e);
                              e.target.value = ""; // Reset input
                            }}
                            className="hidden"
                          />
                        </div>
                      </DropdownMenuItem>
                    </Label>
                    {onRemoveImage && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onRemoveImage()}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Image
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
      </div>
    </div>
  );
}
