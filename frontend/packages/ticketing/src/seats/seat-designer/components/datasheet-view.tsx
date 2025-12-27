/**
 * Datasheet View Component
 *
 * Sheet component for displaying seats or sections in a list/datasheet format
 */

import {
  Button,
  Card,
  Input,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@truths/ui";
import { Controller, UseFormReturn } from "react-hook-form";
import { Edit, FolderOpen, Trash2 } from "lucide-react";
import type { SectionMarker, SeatMarker } from "../types";
import type { SeatFormData } from "../form-schemas";

export interface DatasheetViewProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  viewingSection: SectionMarker | null;
  venueType: "small" | "large";
  displayedSeats: SeatMarker[];
  seats: SeatMarker[];
  sectionMarkers: SectionMarker[];
  selectedSeat: SeatMarker | null;
  isPlacingSeats: boolean;
  isSectionFormOpen: boolean;
  editingSectionId: string | null;
  sectionForm: UseFormReturn<{ name: string }>;
  selectedSectionMarker: SectionMarker | null;
  createSectionMutationPending: boolean;
  updateSectionMutationPending: boolean;
  onSeatClick: (seat: SeatMarker) => void;
  onDeleteSeat: (seat: SeatMarker) => void;
  onOpenNewSectionForm: () => void;
  onCancelSectionForm: () => void;
  onSaveSectionForm: () => void;
  onSectionMarkerClick: (section: SectionMarker, e: React.MouseEvent) => void;
  onOpenSectionDetail: (section: SectionMarker) => void;
  onEditSectionFromSheet: (section: SectionMarker) => void;
  onDeleteSection: (section: SectionMarker) => void;
  onSetViewingSeat: (seat: SeatMarker | null) => void;
  onSetIsEditingViewingSeat: (editing: boolean) => void;
  onSetSelectedSeat: (seat: SeatMarker | null) => void;
  onSetIsDatasheetOpen: (open: boolean) => void;
  seatEditFormReset: (data: SeatFormData) => void;
}

export function DatasheetView({
  isOpen,
  onOpenChange,
  viewingSection,
  venueType,
  displayedSeats,
  seats,
  sectionMarkers,
  selectedSeat,
  isPlacingSeats,
  isSectionFormOpen,
  editingSectionId,
  sectionForm,
  selectedSectionMarker,
  createSectionMutationPending,
  updateSectionMutationPending,
  onDeleteSeat,
  onCancelSectionForm,
  onSaveSectionForm,
  onSectionMarkerClick,
  onOpenSectionDetail,
  onEditSectionFromSheet,
  onDeleteSection,
  onSetViewingSeat,
  onSetIsEditingViewingSeat,
  onSetSelectedSeat,
  onSetIsDatasheetOpen,
  seatEditFormReset,
}: DatasheetViewProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>
            {viewingSection
              ? `Seats - ${viewingSection.name}`
              : venueType === "large"
                ? "Sections"
                : "Seats"}
          </SheetTitle>
          <SheetDescription>
            {viewingSection
              ? `${displayedSeats.length} seat(s) in ${viewingSection.name}`
              : venueType === "large"
                ? `${sectionMarkers.length} section(s) placed`
                : `${seats.length} seat(s) placed`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 overflow-y-auto min-h-0">
          {viewingSection ? (
            // Section detail view - show seats in this section
            <div className="space-y-2">
              {displayedSeats.map((seat) => (
                <div
                  key={seat.id}
                  className={`group p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSeat?.id === seat.id
                      ? "bg-blue-50 border-blue-500"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                  onClick={() => {
                    if (isPlacingSeats) {
                      // In placement mode: select seat for editing
                      onSetSelectedSeat(seat);
                      onSetIsDatasheetOpen(false);
                    } else {
                      // Not in placement mode: show view-only Sheet
                      onSetViewingSeat(seat);
                      onSetIsDatasheetOpen(false);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {seat.seat.row} {seat.seat.seatNumber}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {seat.seat.seatType}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isPlacingSeats && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetViewingSeat(seat);
                            onSetIsEditingViewingSeat(true);
                            seatEditFormReset({
                              section: seat.seat.section,
                              sectionId: seat.seat.sectionId,
                              row: seat.seat.row,
                              seatNumber: seat.seat.seatNumber,
                              seatType: seat.seat.seatType,
                            });
                            onSetIsDatasheetOpen(false);
                          }}
                          className="h-6 w-6 p-0"
                          title="Edit seat"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      {isPlacingSeats && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSeat(seat);
                          }}
                          className="h-6 w-6 p-0"
                          title="Delete seat"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : venueType === "large" ? (
            // Large venue main view - show sections
            <div className="space-y-2">
              {isSectionFormOpen && (
                <Card className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {editingSectionId ? "Update section" : "New section"}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={onCancelSectionForm}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-3"
                        onClick={onSaveSectionForm}
                        disabled={
                          !sectionForm.watch("name")?.trim() ||
                          createSectionMutationPending ||
                          updateSectionMutationPending
                        }
                      >
                        {editingSectionId ? "Update" : "Create"}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Section Name</Label>
                    <Controller
                      name="name"
                      control={sectionForm.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          className="mt-1 h-8 text-sm"
                          placeholder="e.g., Section A"
                          autoFocus
                        />
                      )}
                    />
                  </div>
                </Card>
              )}

              {sectionMarkers.map((section) => (
                <div
                  key={section.id}
                  className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedSectionMarker?.id === section.id
                      ? "bg-blue-50 border-blue-500"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSectionMarkerClick(section, e);
                    onSetIsDatasheetOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                       <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm truncate">{section.name}</span>
                         {section.imageUrl && (
                          <div className="flex items-center text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            Image
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                         <span>
                          {
                            seats.filter((s) => s.seat.section === section.name)
                              .length
                          }{" "}
                          seats
                        </span>
                         {!section.imageUrl && (
                          <>
                            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
                            <span className="italic">No image</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSectionDetail(section);
                          onSetIsDatasheetOpen(false);
                        }}
                        className="h-7 w-7 p-0"
                        title="Open Details"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditSectionFromSheet(section);
                        }}
                        className="h-7 w-7 p-0"
                        title="Edit section"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSection(section);
                        }}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        title="Delete section"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Small venue - show all seats
            <div className="space-y-2">
              {seats.map((seat) => (
                <div
                  key={seat.id}
                  className={`group p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSeat?.id === seat.id
                      ? "bg-blue-50 border-blue-500"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                  onClick={() => {
                    if (isPlacingSeats) {
                      // In placement mode: select seat for editing
                      onSetSelectedSeat(seat);
                      onSetIsDatasheetOpen(false);
                    } else {
                      // Not in placement mode: show view-only Sheet
                      onSetViewingSeat(seat);
                      onSetIsDatasheetOpen(false);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {seat.seat.section} {seat.seat.row}{" "}
                        {seat.seat.seatNumber}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {seat.seat.seatType}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isPlacingSeats && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetViewingSeat(seat);
                            onSetIsEditingViewingSeat(true);
                            seatEditFormReset({
                              section: seat.seat.section,
                              sectionId: seat.seat.sectionId,
                              row: seat.seat.row,
                              seatNumber: seat.seat.seatNumber,
                              seatType: seat.seat.seatType,
                            });
                            onSetIsDatasheetOpen(false);
                          }}
                          className="h-6 w-6 p-0"
                          title="Edit seat"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      {isPlacingSeats && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSeat(seat);
                          }}
                          className="h-6 w-6 p-0"
                          title="Delete seat"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
