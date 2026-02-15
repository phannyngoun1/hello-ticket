/**
 * Selected Section Sheet Component
 *
 * Sheet displaying information about the currently selected section
 */

import {
  Button,
  Label,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@truths/ui";
import { Trash2, Edit, FolderOpen } from "lucide-react";
import type { SectionMarker, SeatMarker } from "../types";

export interface SelectedSectionSheetProps {
  selectedSectionMarker: SectionMarker | null;
  seats: SeatMarker[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSectionDetail: (section: SectionMarker) => void;
  onEdit: (section: SectionMarker) => void;
  onDelete: (section: SectionMarker) => void;
}

export function SelectedSectionSheet({
  selectedSectionMarker,
  seats,
  isOpen,
  onOpenChange,
  onOpenSectionDetail,
  onEdit,
  onDelete,
}: SelectedSectionSheetProps) {
  if (!selectedSectionMarker) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>Selected Section</SheetTitle>
          <SheetDescription>
            View and manage the selected section
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 px-6 flex-1  min-h-0 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <div className="mt-1 text-sm font-medium">
                {selectedSectionMarker.name}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Seats</Label>
              <div className="mt-1 text-sm font-medium">
                {
                  seats.filter(
                    (s) => s.seat.section === selectedSectionMarker.name
                  ).length
                }{" "}
                seat(s)
              </div>
            </div>
            {(selectedSectionMarker.x !== undefined ||
              selectedSectionMarker.y !== undefined) && (
              <div>
                <Label className="text-muted-foreground">Position</Label>
                <div className="mt-1 text-sm font-medium">
                  X: {selectedSectionMarker.x?.toFixed(2) ?? "N/A"}%, Y:{" "}
                  {selectedSectionMarker.y?.toFixed(2) ?? "N/A"}%
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenSectionDetail(selectedSectionMarker);
                onOpenChange(false);
              }}
              className="flex-1"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Open
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onEdit(selectedSectionMarker);
                onOpenChange(false);
              }}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(selectedSectionMarker);
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
