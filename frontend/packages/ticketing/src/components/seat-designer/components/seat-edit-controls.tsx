/**
 * Seat Edit Controls Component
 *
 * Compact inline form for editing a selected seat in the toolbox.
 * Similar to section designer - edit happens inline instead of a sheet.
 */

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { Check, X } from "lucide-react";
import { Controller, UseFormReturn } from "react-hook-form";
import { SeatType } from "../../../seats/types";
import type { SeatFormData } from "../form-schemas";

export interface SeatEditControlsProps {
  form: UseFormReturn<SeatFormData>;
  uniqueSections: string[];
  sectionsData?: Array<{ id: string; name: string }>;
  sectionMarkers?: Array<{ id: string; name: string }>;
  designMode: "seat-level" | "section-level";
  viewingSection?: { name: string } | null;
  onSave: (data: SeatFormData) => void;
  onCancel: () => void;
  isUpdating?: boolean;
  /** When true, no left border (edit mode is the only thing in toolbox) */
  standalone?: boolean;
}

export function SeatEditControls({
  form,
  uniqueSections,
  sectionsData,
  sectionMarkers,
  designMode,
  viewingSection,
  onSave,
  onCancel,
  isUpdating = false,
  standalone = false,
}: SeatEditControlsProps) {
  const handleSectionChange = (value: string) => {
    form.setValue("section", value);
    const source = designMode === "seat-level" ? sectionsData : sectionMarkers;
    const section = source?.find((s) => s.name === value);
    if (section) form.setValue("sectionId", section.id);
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", !standalone && "border-l pl-2.5")}>
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap shrink-0">
        Edit:
      </span>
      <Controller
        name="section"
        control={form.control}
        render={({ field }) => (
          <Select
            value={viewingSection ? viewingSection.name : field.value || ""}
            onValueChange={handleSectionChange}
            disabled={!!viewingSection}
          >
            <SelectTrigger className="h-6 text-xs w-20 min-w-20">
              <SelectValue placeholder="Section" />
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
      <Controller
        name="row"
        control={form.control}
        render={({ field }) => (
          <Input
            {...field}
            className="h-6 text-xs w-10"
            placeholder="Row"
          />
        )}
      />
      <Controller
        name="seatNumber"
        control={form.control}
        render={({ field }) => (
          <Input
            {...field}
            className="h-6 text-xs w-10"
            placeholder="#"
          />
        )}
      />
      <Controller
        name="seatType"
        control={form.control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="h-6 text-xs w-20">
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
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={form.handleSubmit(onSave)}
          disabled={isUpdating}
          className={cn(
            "flex items-center justify-center h-6 w-6 rounded border transition-all shrink-0",
            "hover:bg-primary hover:border-primary hover:text-primary-foreground",
            "bg-background border-border"
          )}
          title="Save"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isUpdating}
          className={cn(
            "flex items-center justify-center h-6 w-6 rounded border transition-all shrink-0",
            "hover:bg-accent hover:border-accent-foreground",
            "bg-background border-border"
          )}
          title="Cancel"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
