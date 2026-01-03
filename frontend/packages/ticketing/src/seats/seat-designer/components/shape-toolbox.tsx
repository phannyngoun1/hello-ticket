/**
 * Shape Toolbox Component
 * 
 * Toolbox for selecting shape tools to draw on the canvas
 */

import { Card } from "@truths/ui";
import { Circle, Square, Hexagon, MousePointer2, Edit } from "lucide-react";
import { PlacementShapeType, type SeatMarker, type SectionMarker } from "../types";
import { cn } from "@truths/ui/lib/utils";

export interface ShapeToolboxProps {
  selectedShapeType: PlacementShapeType | null;
  onShapeTypeSelect: (shapeType: PlacementShapeType | null) => void;
  selectedSeat?: SeatMarker | null;
  selectedSection?: SectionMarker | null;
  onSeatEdit?: (seat: SeatMarker) => void;
  onSectionEdit?: (section: SectionMarker) => void;
  className?: string;
}

export function ShapeToolbox({
  selectedShapeType,
  onShapeTypeSelect,
  selectedSeat,
  selectedSection,
  onSeatEdit,
  onSectionEdit,
  className,
}: ShapeToolboxProps) {
  const shapes = [
    {
      type: PlacementShapeType.CIRCLE,
      icon: Circle,
      label: "Circle",
    },
    {
      type: PlacementShapeType.RECTANGLE,
      icon: Square,
      label: "Rectangle",
    },
    {
      type: PlacementShapeType.ELLIPSE,
      icon: Circle,
      label: "Ellipse",
    },
    {
      type: PlacementShapeType.POLYGON,
      icon: Hexagon,
      label: "Polygon",
    },
  ];

  // Get marker name and edit handler
  const selectedMarker = selectedSeat || selectedSection;
  const markerName = selectedSeat
    ? `${selectedSeat.seat.section} ${selectedSeat.seat.row}-${selectedSeat.seat.seatNumber}`
    : selectedSection
      ? selectedSection.name
      : null;
  const handleEdit = selectedSeat && onSeatEdit
    ? () => onSeatEdit(selectedSeat)
    : selectedSection && onSectionEdit
      ? () => onSectionEdit(selectedSection)
      : undefined;

  return (
    <Card className={cn("p-2", className)}>
      <div className="flex items-center gap-2 justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Shapes:
          </div>
          <div className="flex gap-1">
            {/* Pointer tool (deselect) */}
            <button
              type="button"
              onClick={() => onShapeTypeSelect(null)}
              className={cn(
                "flex items-center justify-center p-1.5 rounded border transition-all",
                "hover:bg-accent hover:border-accent-foreground",
                !selectedShapeType
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background border-border"
              )}
              title="Pointer (Select)"
            >
              <MousePointer2 className="h-3.5 w-3.5" />
            </button>
            
            {/* Shape tools */}
            {shapes.map((shape) => {
              const Icon = shape.icon;
              const isSelected = selectedShapeType === shape.type;
              return (
                <button
                  key={shape.type}
                  type="button"
                  onClick={() => {
                    onShapeTypeSelect(shape.type);
                  }}
                  className={cn(
                    "flex items-center justify-center p-1.5 rounded border transition-all",
                    "hover:bg-accent hover:border-accent-foreground hover:shadow-sm",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background border-border"
                  )}
                  title={shape.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Selected marker name - shown on the right */}
        {selectedMarker && markerName && (
          <button
            type="button"
            onClick={handleEdit}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all",
              "hover:bg-accent hover:border-accent-foreground",
              "bg-background border-border",
              handleEdit && "cursor-pointer"
            )}
            title={handleEdit ? "Click to edit" : undefined}
          >
            <span className="text-xs font-medium text-foreground whitespace-nowrap">
              {markerName}
            </span>
            {handleEdit && (
              <Edit className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
    </Card>
  );
}

