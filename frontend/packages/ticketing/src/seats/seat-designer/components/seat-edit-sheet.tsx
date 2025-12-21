/**
 * Seat Edit Sheet Component
 * 
 * Sheet for viewing and editing seat information
 */

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@truths/ui";
import { Controller, UseFormReturn } from "react-hook-form";
import { SeatType } from "../../types";
import type { SeatMarker } from "../types";
import type { SeatFormData } from "../form-schemas";

export interface SeatEditSheetProps {
  viewingSeat: SeatMarker | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  isPlacingSeats: boolean;
  form: UseFormReturn<SeatFormData>;
  uniqueSections: string[];
  sectionsData?: Array<{ id: string; name: string }>;
  sectionMarkers?: Array<{ id: string; name: string }>;
  designMode: "seat-level" | "section-level";
  isUpdating: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onSave: (data: SeatFormData) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function SeatEditSheet({
  viewingSeat,
  isOpen,
  onOpenChange,
  isEditing,
  isPlacingSeats,
  form,
  uniqueSections,
  sectionsData,
  sectionMarkers,
  designMode,
  isUpdating,
  isDeleting,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: SeatEditSheetProps) {
  if (!viewingSeat) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Seat Information</SheetTitle>
          <SheetDescription>
            {isPlacingSeats
              ? isEditing
                ? "Edit seat details"
                : "View or edit this seat"
              : "View seat details (read-only)"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {isEditing ? (
            // Edit mode
            <>
              <div className="space-y-4">
                <div>
                  <Label>Section</Label>
                  <Controller
                    name="section"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value || ""}
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Find the section_id for the selected section name
                          let sectionId: string | undefined;
                          if (sectionsData && designMode === "seat-level") {
                            const section = sectionsData.find(
                              (s) => s.name === value
                            );
                            sectionId = section?.id;
                          } else if (designMode === "section-level" && sectionMarkers) {
                            const section = sectionMarkers.find(
                              (s) => s.name === value
                            );
                            sectionId = section?.id;
                          }
                          form.setValue("sectionId", sectionId);
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueSections.map((section) => (
                            <SelectItem key={section} value={section}>
                              {section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Label>Row</Label>
                  <Controller
                    name="row"
                    control={form.control}
                    render={({ field }) => (
                      <Input {...field} className="mt-1" />
                    )}
                  />
                </div>
                <div>
                  <Label>Seat Number</Label>
                  <Controller
                    name="seatNumber"
                    control={form.control}
                    render={({ field }) => (
                      <Input {...field} className="mt-1" />
                    )}
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Controller
                    name="seatType"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(SeatType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={form.handleSubmit(onSave)}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            // View mode
            <>
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
              {isPlacingSeats && (
                <div className="pt-4 border-t space-y-2">
                  <Button variant="outline" className="w-full" onClick={onEdit}>
                    Edit Seat
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={onDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Seat"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

