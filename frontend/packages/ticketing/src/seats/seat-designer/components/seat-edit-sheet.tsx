/**
 * Seat Edit Sheet Component
 *
 * Sheet for viewing seat information (read-only). Edit happens inline in the toolbox.
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
import { Edit, Trash2 } from "lucide-react";
import type { SeatMarker } from "../types";

export interface SeatEditSheetProps {
  viewingSeat: SeatMarker | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isPlacingSeats: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function SeatEditSheet({
  viewingSeat,
  isOpen,
  onOpenChange,
  isPlacingSeats,
  isDeleting,
  onEdit,
  onDelete,
}: SeatEditSheetProps) {
  if (!viewingSeat) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>Seat Information</SheetTitle>
          <SheetDescription>
            {isPlacingSeats
              ? "View seat details"
              : "View seat details (read-only)"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex-1 min-h-0 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Section</Label>
              <div className="mt-1 text-sm font-medium">
                {viewingSeat.seat.section}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Row</Label>
              <div className="mt-1 text-sm font-medium">
                {viewingSeat.seat.row}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Seat Number</Label>
              <div className="mt-1 text-sm font-medium">
                {viewingSeat.seat.seatNumber}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Type</Label>
              <div className="mt-1 text-sm font-medium">
                {viewingSeat.seat.seatType}
              </div>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Position</Label>
              <div className="mt-1 text-sm font-medium">
                X: {viewingSeat.x.toFixed(2)}%, Y:{" "}
                {viewingSeat.y.toFixed(2)}%
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t">
            {isPlacingSeats && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit();
                  onOpenChange(false);
                }}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit in Toolbox
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
              disabled={isDeleting}
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
