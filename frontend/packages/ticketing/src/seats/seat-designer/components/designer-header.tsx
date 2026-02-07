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
}: DesignerHeaderProps) {
  // Logic for showing datasheet toggle
  const showDatasheetButton =
    (venueType === "large" && sectionMarkers.length > 0) ||
    (venueType === "small" && seats.length > 0) ||
    (viewingSection && displayedSeats.length > 0);

  // Logic for showing dropdown menu
  const showMenu =
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
          <span className="text-xs text-muted-foreground">Loading seats...</span>
        )}
        {seatsError && (
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
        
        {showMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onClearAllPlacements}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Placements
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Label htmlFor="change-main-image" className="cursor-pointer">
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
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
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
