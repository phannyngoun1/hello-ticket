/**
 * Section Placement Controls Component
 * 
 * Controls for placing sections in section-level design mode
 */



import { Button, Card, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@truths/ui";
import { Trash2 } from "lucide-react";
import type { SectionMarker } from "../types";

export interface SectionPlacementControlsProps {
  selectedSectionMarker: SectionMarker | null;
  sectionMarkers: SectionMarker[];
  sectionFormName: string;
  onSectionSelect: (sectionId: string) => void;
  onNewSection: () => void;
  onDeleteSection?: (section: SectionMarker) => void;
  onUseSectionName: (name: string) => void;
}

export function SectionPlacementControls({
  selectedSectionMarker,
  sectionMarkers,
  sectionFormName,
  onSectionSelect,
  onNewSection,
  onDeleteSection,
  onUseSectionName,
}: SectionPlacementControlsProps) {
  return (
    <>
      <Card className="p-3">
        {selectedSectionMarker && (
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">
              Editing: {selectedSectionMarker.name}
            </p>
            {onDeleteSection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDeleteSection(selectedSectionMarker);
                }}
                className="h-6 px-2"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
        <div>
          <Label className="text-xs">Section</Label>
          <Select
            value={selectedSectionMarker?.id || ""}
            onValueChange={(value) => {
              if (value === "new-section") {
                onNewSection();
              } else {
                onSectionSelect(value);
              }
            }}
          >
            <SelectTrigger className="mt-1 h-8 text-sm">
              <SelectValue placeholder="Select or create section" />
            </SelectTrigger>
            <SelectContent>
              {sectionMarkers.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))}
              
            </SelectContent>
          </Select>
        </div>
      </Card>
    </>
  );
}

