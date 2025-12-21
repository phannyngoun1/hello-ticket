/**
 * Section Form Sheet Component
 * 
 * Sheet for creating and editing sections
 */

import { Button, Input, Label, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@truths/ui";
import { Controller, UseFormReturn } from "react-hook-form";
import type { SectionFormData } from "../form-schemas";

export interface SectionFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<SectionFormData>;
  editingSectionId: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function SectionFormSheet({
  open,
  onOpenChange,
  form,
  editingSectionId,
  isCreating,
  isUpdating,
  onSave,
  onCancel,
}: SectionFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>
            {editingSectionId ? "Edit Section" : "New Section"}
          </SheetTitle>
          <SheetDescription>
            {editingSectionId
              ? "Update the section details"
              : "Create a new section for your layout"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="section-name">Section Name</Label>
            <Controller
              name="name"
              control={form.control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="section-name"
                  className="mt-1.5"
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
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={isCreating || isUpdating}
              className="flex-1"
            >
              {editingSectionId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

