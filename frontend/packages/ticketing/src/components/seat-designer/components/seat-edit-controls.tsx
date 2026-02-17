/**
 * Seat Edit Controls Component
 *
 * Compact inline form for editing a selected seat in the toolbox.
 * Similar to section designer - edit happens inline instead of a sheet.
 */

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@truths/ui";
import { cn } from "@truths/ui/lib/utils";
import { Check, Edit, X } from "lucide-react";
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
  /** Open new section form; when section is created, it will be set on the seat (seat-level only) */
  onNewSection?: () => void;
  /** Open manage sections sheet */
  onManageSections?: () => void;
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
  onNewSection,
  onManageSections,
}: SeatEditControlsProps) {
  const handleSectionChange = (value: string) => {
    form.setValue("section", value);
    const section =
      (designMode === "seat-level" ? sectionsData : sectionMarkers)?.find(
        (s) => s.name === value,
      ) ?? sectionMarkers?.find((s) => s.name === value);
    if (section) form.setValue("sectionId", section.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      form.handleSubmit(onSave)();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
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
            onValueChange={(value) => {
              if (value === "new-section" && onNewSection) {
                onNewSection();
              } else if (value === "manage-sections" && onManageSections) {
                onManageSections();
              } else {
                handleSectionChange(value);
              }
            }}
            disabled={!!viewingSection}
          >
            <SelectTrigger className="h-6 text-xs w-28 min-w-28">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              {uniqueSections.map((section) => (
                <SelectItem key={section} value={section}>
                  {section}
                </SelectItem>
              ))}
              {!viewingSection && designMode === "seat-level" && (
                <>
                  <div className="h-px bg-border my-1 mx-2" />
                  {onNewSection && (
                    <SelectItem value="new-section">
                      <div className="flex items-center gap-2 font-medium text-primary">
                        <span>+ New Section</span>
                      </div>
                    </SelectItem>
                  )}
                  {onManageSections && (
                    <SelectItem value="manage-sections">
                      <div className="flex items-center gap-2 font-medium">
                        <Edit className="h-3 w-3" />
                        <span>Manage Sections</span>
                      </div>
                    </SelectItem>
                  )}
                </>
              )}
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
            className="h-6 text-xs w-14 min-w-14"
            placeholder="Row"
            onKeyDown={handleKeyDown}
          />
        )}
      />
      <Controller
        name="seatNumber"
        control={form.control}
        render={({ field }) => (
          <Input
            {...field}
            className="h-6 text-xs w-14 min-w-14"
            placeholder="#"
            onKeyDown={handleKeyDown}
          />
        )}
      />
      <Controller
        name="seatType"
        control={form.control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="h-6 text-xs w-28 min-w-28">
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
