/**
 * Selected Section Card Component
 * 
 * Card displaying information about the currently selected section
 */

import { Button, Card } from "@truths/ui";
import { Trash2, X } from "lucide-react";
import type { SectionMarker, SeatMarker } from "../types";

export interface SelectedSectionCardProps {
  selectedSectionMarker: SectionMarker;
  seats: SeatMarker[];
  onClear: () => void;
  onOpenSectionDetail: (section: SectionMarker) => void;
  onUseNameForNext: (name: string) => void;
  onDelete: (section: SectionMarker) => void;
}

export function SelectedSectionCard({
  selectedSectionMarker,
  seats,
  onClear,
  onOpenSectionDetail,
  onUseNameForNext,
  onDelete,
}: SelectedSectionCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">Selected Section</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-500">Name:</span>{" "}
          {selectedSectionMarker.name}
        </div>
        <div>
          <span className="text-gray-500">Floor Plan:</span>{" "}
          {selectedSectionMarker.imageUrl ? "Added" : "Not added"}
        </div>
        <div>
          <span className="text-gray-500">Seats:</span>{" "}
          {
            seats.filter(
              (s) => s.seat.section === selectedSectionMarker.name
            ).length
          }{" "}
          seat(s)
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button
          variant="default"
          size="sm"
          onClick={() => onOpenSectionDetail(selectedSectionMarker)}
        >
          Open Section Detail
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onUseNameForNext(selectedSectionMarker.name)}
        >
          Use Name for Next
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(selectedSectionMarker)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </Card>
  );
}

