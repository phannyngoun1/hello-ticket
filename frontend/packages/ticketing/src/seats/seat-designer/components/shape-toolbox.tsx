/**
 * Shape Toolbox Component
 *
 * Toolbox for selecting shape tools to draw on the canvas
 */

import { Card } from "@truths/ui";
import {
  Circle,
  Square,
  Hexagon,
  MousePointer2,
  Edit,
  PenTool,
  Trash2,
  Eye,
} from "lucide-react";
import {
  PlacementShapeType,
  type SeatMarker,
  type SectionMarker,
} from "../types";
import { cn } from "@truths/ui/lib/utils";

export interface ShapeToolboxProps {
  selectedShapeType: PlacementShapeType | null;
  onShapeTypeSelect: (shapeType: PlacementShapeType | null) => void;
  selectedSeat?: SeatMarker | null;
  selectedSection?: SectionMarker | null;
  onSeatEdit?: (seat: SeatMarker) => void;
  onSeatView?: (seat: SeatMarker) => void;
  onSectionEdit?: (section: SectionMarker) => void;
  onSectionView?: (section: SectionMarker) => void;
  onSeatDelete?: (seat: SeatMarker) => void;
  onSectionDelete?: (section: SectionMarker) => void;
  className?: string;
  readOnly?: boolean;
}

export function ShapeToolbox({
  selectedShapeType,
  onShapeTypeSelect,
  selectedSeat,
  selectedSection,
  onSeatEdit,
  onSeatView,
  onSectionEdit,
  onSectionView,
  onSeatDelete,
  onSectionDelete,
  className,
  readOnly = false,
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
    {
      type: PlacementShapeType.FREEFORM,
      icon: PenTool,
      label: "Polygon",
    },
  ];

  // Get marker name and edit/delete handlers
  const selectedMarker = selectedSeat || selectedSection;
  const markerName = selectedSeat
    ? `${selectedSeat.seat.section} ${selectedSeat.seat.row}-${selectedSeat.seat.seatNumber}`
    : selectedSection
      ? selectedSection.name
      : null;
  const handleEdit =
    selectedSeat && onSeatEdit
      ? () => onSeatEdit(selectedSeat)
      : selectedSection && onSectionEdit
        ? () => onSectionEdit(selectedSection)
        : undefined;
  const handleView =
    selectedSeat && onSeatView
      ? () => onSeatView(selectedSeat)
      : selectedSection && onSectionView
        ? () => onSectionView(selectedSection)
        : undefined;
  const handleDelete =
    selectedSeat && onSeatDelete
      ? () => onSeatDelete(selectedSeat)
      : selectedSection && onSectionDelete
        ? () => onSectionDelete(selectedSection)
        : undefined;

  return (
    <Card className={cn("px-3 py-2.5", className)}>
      <div className="flex items-center gap-3 justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Shapes:
          </div>
          <div className="flex gap-1.5">
            {/* Pointer tool (deselect) */}
            <button
              type="button"
              onClick={() => onShapeTypeSelect?.(null)}
              disabled={readOnly || !onShapeTypeSelect}
              className={cn(
                "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                !readOnly && "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95",
                readOnly && "opacity-50 cursor-not-allowed",
                !selectedShapeType && !readOnly
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background border-border"
              )}
              title="Pointer (Select)"
            >
              <MousePointer2 className="h-3.5 w-3.5 transition-transform duration-200" />
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
                    onShapeTypeSelect?.(shape.type);
                  }}
                  disabled={readOnly || !onShapeTypeSelect}
                  className={cn(
                    "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                    !readOnly && "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95",
                    readOnly && "opacity-50 cursor-not-allowed",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background border-border"
                  )}
                  title={shape.label}
                >
                  <Icon className="h-3.5 w-3.5 transition-transform duration-200" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected marker name with view, edit and delete actions - shown on the right */}
        {selectedMarker && markerName && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-foreground whitespace-nowrap px-2.5 py-1">
              {markerName}
            </span>
            {handleView && (
              <button
                type="button"
                onClick={handleView}
                className={cn(
                  "flex items-center justify-center p-1 rounded border transition-all",
                  "hover:bg-accent hover:border-accent-foreground",
                  "bg-background border-border"
                )}
                title="View details"
              >
                <Eye className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
            {handleEdit && !readOnly && (
              <button
                type="button"
                onClick={handleEdit}
                className={cn(
                  "flex items-center justify-center p-1 rounded border transition-all",
                  "hover:bg-accent hover:border-accent-foreground",
                  "bg-background border-border"
                )}
                title="Click to edit"
              >
                <Edit className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
            {handleDelete && !readOnly && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className={cn(
                  "flex items-center justify-center p-1 rounded border transition-all",
                  "hover:bg-destructive hover:border-destructive hover:text-destructive-foreground",
                  "bg-background border-border"
                )}
                title="Delete marker"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
