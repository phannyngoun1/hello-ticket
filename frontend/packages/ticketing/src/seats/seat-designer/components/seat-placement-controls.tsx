/**
 * Seat Placement Controls Component
 * 
 * Controls for placing seats with section, row, seat number, and type selection
 */

import { Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@truths/ui";
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
}: SeatPlacementControlsProps) {
  return (
    <Card className="p-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Section / Row / Seat #</Label>
          <div className="flex gap-2 mt-1">
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
                      // Reset select to current section
                      onSectionSelectValueChange(field.value || "");
                    } else if (value === "manage-sections" && onManageSections) {
                      onManageSections();
                      // Reset select to current section
                      onSectionSelectValueChange(field.value || "");
                    } else {
                      field.onChange(value);
                      onSectionSelectValueChange(value);
                      // Find and set sectionId
                      const section = sectionsData?.find(
                        (s) => s.name === value
                      );
                      if (section) {
                        form.setValue("sectionId", section.id);
                      }
                    }
                  }}
                  disabled={!!viewingSection}
                >
                  <SelectTrigger className="h-8 text-sm flex-1">
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
                  className="h-8 text-sm w-16"
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
                  className="h-8 text-sm w-16"
                  placeholder="#"
                />
              )}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">Type</Label>
          <Controller
            name="seatType"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="mt-1 h-8 text-sm">
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
    </Card>
  );
}

