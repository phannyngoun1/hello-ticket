/**
 * Seat Placement Controls Component
 *
 * Controls for placing seats with section, row, seat number, and type selection
 */

import {
  Card,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@truths/ui";
import { Edit } from "lucide-react";
import { Controller, UseFormReturn } from "react-hook-form";
import { SeatType } from "../../types";
import type { SeatFormData } from "../form-schemas";

export interface SeatPlacementControlsProps {
  form: UseFormReturn<SeatFormData>;
  uniqueSections: string[];
  sectionsData?: Array<{ id: string; name: string }>;
  sectionSelectValue: string;
  onSectionSelectValueChange: (value: string) => void;
  viewingSection?: { name: string } | null;
  onNewSection: () => void;
  onManageSections?: () => void;
  /** Inline compact variant for placement inside ShapeToolbox */
  compact?: boolean;
}

export function SeatPlacementControls({
  form,
  uniqueSections,
  sectionsData,
  sectionSelectValue,
  onSectionSelectValueChange,
  viewingSection,
  onNewSection,
  onManageSections,
  compact = false,
}: SeatPlacementControlsProps) {
  const sectionRow = (
    <>
      <Controller
        name="section"
        control={form.control}
        render={({ field }) => (
          <Select
            value={
              viewingSection
                ? viewingSection.name
                : sectionSelectValue || field.value || ""
            }
            onValueChange={(value) => {
              if (value === "new-section") {
                onNewSection();
                onSectionSelectValueChange(field.value || "");
              } else if (value === "manage-sections" && onManageSections) {
                onManageSections();
                onSectionSelectValueChange(field.value || "");
              } else {
                field.onChange(value);
                onSectionSelectValueChange(value);
                const section = sectionsData?.find((s) => s.name === value);
                if (section) form.setValue("sectionId", section.id);
              }
            }}
            disabled={!!viewingSection}
          >
            <SelectTrigger
              className={
                compact ? "h-6 text-xs w-20 min-w-20" : "h-8 text-sm flex-1"
              }
            >
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              {uniqueSections.map((section) => (
                <SelectItem key={section} value={section}>
                  {section}
                </SelectItem>
              ))}
              {!viewingSection && (
                <>
                  <div className="h-px bg-border my-1 mx-2" />
                  <SelectItem value="new-section">
                    <div className="flex items-center gap-2 font-medium text-primary">
                      <span>+ New Section</span>
                    </div>
                  </SelectItem>
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
            className={compact ? "h-6 text-xs w-10" : "h-8 text-sm w-16"}
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
            className={compact ? "h-6 text-xs w-10" : "h-8 text-sm w-16"}
            placeholder="#"
          />
        )}
      />
    </>
  );

  const typeSelect = (
    <Controller
      name="seatType"
      control={form.control}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger
            className={compact ? "h-6 text-xs w-20" : "mt-1 h-8 text-sm"}
          >
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
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap shrink-0">
          Place:
        </span>
        <div className="flex items-center gap-1.5">{sectionRow}</div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground shrink-0">Type</span>
          {typeSelect}
        </div>
      </div>
    );
  }

  return (
    <Card className="p-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Section / Row / Seat #</Label>
          <div className="flex gap-2 mt-1">{sectionRow}</div>
        </div>
        <div>
          <Label className="text-xs">Type</Label>
          {typeSelect}
        </div>
      </div>
    </Card>
  );
}
