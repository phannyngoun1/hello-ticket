/**
 * Manage Sections Sheet Component
 *
 * Sheet to list, edit, and delete sections from the database (seat-level mode)
 */

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Card,
  Button,
  Input,
  Label,
} from "@truths/ui";
import { Edit, Trash2 } from "lucide-react";
import { Controller, UseFormReturn } from "react-hook-form";
import type { Section } from "../../../sections/types";
import type { SectionFormData } from "../form-schemas";

interface ManageSectionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Section[] | undefined;
  onEdit: (section: Section) => void;
  onDelete: (section: Section) => void;
  isDeleting: boolean;
  form: UseFormReturn<SectionFormData>;
  editingSectionId: string | null;
  isUpdating: boolean;
  onSave: () => void;
  onCancelEdit: () => void;
}

export function ManageSectionsSheet({
  open,
  onOpenChange,
  sections,
  onEdit,
  onDelete,
  isDeleting,
  form,
  editingSectionId,
  isUpdating,
  onSave,
  onCancelEdit,
}: ManageSectionsSheetProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const editingSection = sections?.find((s) => s.id === editingSectionId);
  const nameValue = form.watch("name");
  const trimmedName = nameValue?.trim() || "";
  const isNameValid = trimmedName.length > 0;
  const canSubmit = isNameValid;

  // Switch to edit mode when editingSectionId changes
  useEffect(() => {
    if (editingSectionId && open) {
      setIsEditMode(true);
    } else if (!editingSectionId) {
      setIsEditMode(false);
    }
  }, [editingSectionId, open]);

  // Reset edit mode when sheet closes
  useEffect(() => {
    if (!open) {
      setIsEditMode(false);
    }
  }, [open]);

  const handleEditClick = (section: Section) => {
    onEdit(section);
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    onCancelEdit();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] flex flex-col"
      >
        {isEditMode && editingSection ? (
          <>
            <SheetHeader>
              <SheetTitle>Edit Section</SheetTitle>
              <SheetDescription>Update the section details</SheetDescription>
            </SheetHeader>
            <div className="mt-6 flex-1 min-h-0">
              <div className="px-6 space-y-4">
                <div>
                  <Label htmlFor="section-name">Section Name</Label>
                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="section-name"
                        className="mt-2"
                        placeholder="e.g., Section A, VIP Area, General Admission"
                        autoFocus
                      />
                    )}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={onSave}
                    disabled={isUpdating || !canSubmit}
                    className="flex-1"
                  >
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>Manage Sections</SheetTitle>
              <SheetDescription>
                Edit or delete sections for this layout
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 px-6 flex-1 overflow-y-auto min-h-0 space-y-4">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {sections?.length || 0} section(s)
                </p>
              </div>
              <div className="space-y-2">
                {sections && sections.length > 0 ? (
                  sections.map((section) => {
                    const seatCount = section.seat_count ?? 0;
                    const hasSeats = seatCount > 0;
                    return (
                      <Card key={section.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{section.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              {section.x_coordinate != null &&
                                section.y_coordinate != null && (
                                  <p className="text-xs text-muted-foreground">
                                    Position: ({section.x_coordinate.toFixed(1)},{" "}
                                    {section.y_coordinate.toFixed(1)})
                                  </p>
                                )}
                              <p className="text-xs text-muted-foreground">
                                {seatCount === 0
                                  ? "No seats"
                                  : `${seatCount} seat${seatCount === 1 ? "" : "s"}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(section)}
                              className="h-8 px-2"
                              title="Edit section"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(section)}
                              className="h-8 px-2 text-destructive hover:text-destructive"
                              title={
                                hasSeats
                                  ? `Cannot delete: ${seatCount} seat${seatCount === 1 ? "" : "s"} attached`
                                  : "Delete section"
                              }
                              disabled={isDeleting || hasSeats}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No sections found. Create your first section.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
