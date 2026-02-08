/**
 * Shape Toolbox Component
 *
 * Toolbox for selecting shape tools to draw on the canvas
 */

import { Card, Input, Label } from "@truths/ui";
import {
  Circle,
  Square,
  Hexagon,
  MousePointer2,
  Edit,
  PenTool,
  Trash2,
  Eye,
  RotateCcw,
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
  onSeatShapeStyleChange?: (
    seatId: string,
    style: { fillColor?: string; strokeColor?: string }
  ) => void;
  onSectionShapeStyleChange?: (
    sectionId: string,
    style: { fillColor?: string; strokeColor?: string }
  ) => void;
  /** Compact seat placement controls rendered after shapes and seat info */
  seatPlacementControls?: React.ReactNode;
  /** Inline seat edit controls - when provided and selectedSeat, replaces marker name + View/Edit/Delete */
  seatEditControls?: React.ReactNode;
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
  onSeatShapeStyleChange,
  onSectionShapeStyleChange,
  seatPlacementControls,
  seatEditControls,
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

  const markerShape = selectedSeat?.shape ?? selectedSection?.shape;
  const onStyleChange =
    selectedSeat && onSeatShapeStyleChange
      ? (style: { fillColor?: string; strokeColor?: string }) =>
          onSeatShapeStyleChange(selectedSeat.id, style)
      : selectedSection && onSectionShapeStyleChange
        ? (style: { fillColor?: string; strokeColor?: string }) =>
            onSectionShapeStyleChange(selectedSection.id, style)
        : undefined;
  const showColorControls =
    !readOnly &&
    selectedMarker &&
    onStyleChange &&
    (selectedSeat || (selectedSection && selectedSection.shape));

  return (
    <Card className={cn("px-3 py-2.5", className)}>
      <div className="flex items-center gap-3 flex-wrap w-full">
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

        {/* Compact seat placement controls - right after shapes so always visible in seat-level */}
        {seatPlacementControls && (
          <div className="flex items-center gap-2 border-l pl-2.5">
            {seatPlacementControls}
          </div>
        )}

        {/* Fill and border color - in line with shapes when a seat or section (with shape) is selected */}
        {showColorControls && (
          <div className="flex items-center gap-2 border-l pl-2.5">
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground shrink-0 w-7">Fill</Label>
              <input
                type="color"
                aria-label="Fill color"
                title="Fill color"
                value={markerShape?.fillColor?.trim() || "#60a5fa"}
                onChange={(e) =>
                  onStyleChange?.({ fillColor: e.target.value })
                }
                className="h-6 w-7 cursor-pointer rounded border shrink-0"
              />
              <Input
                className="h-6 w-16 font-mono text-[11px] py-0 px-1 min-w-0"
                placeholder="#rrggbb"
                aria-label="Fill color hex"
                value={markerShape?.fillColor?.trim() || ""}
                onChange={(e) =>
                  onStyleChange?.({
                    fillColor: e.target.value || undefined,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground shrink-0 w-12">Border</Label>
              <input
                type="color"
                aria-label="Border color"
                title="Border color"
                value={markerShape?.strokeColor?.trim() || "#2563eb"}
                onChange={(e) =>
                  onStyleChange?.({ strokeColor: e.target.value })
                }
                className="h-6 w-7 cursor-pointer rounded border shrink-0"
              />
              <Input
                className="h-6 w-16 font-mono text-[11px] py-0 px-1 min-w-0"
                placeholder="#rrggbb"
                aria-label="Border color hex"
                value={markerShape?.strokeColor?.trim() || ""}
                onChange={(e) =>
                  onStyleChange?.({
                    strokeColor: e.target.value || undefined,
                  })
                }
              />
            </div>
            <button
              type="button"
              onClick={() =>
                onStyleChange?.({
                  fillColor: undefined,
                  strokeColor: undefined,
                })
              }
              className={cn(
                "flex items-center justify-center h-6 w-6 rounded border transition-all shrink-0",
                "hover:bg-accent hover:border-accent-foreground",
                "bg-background border-border"
              )}
              title="Reset to default colors"
              aria-label="Reset to default colors"
            >
              <RotateCcw className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Inline seat edit controls - replaces marker name when editing seat */}
        {selectedSeat && seatEditControls ? (
          seatEditControls
        ) : (
        /* Selected marker name with view, edit and delete actions */
        selectedMarker && markerName && (
          <div className="flex items-center gap-1.5 ml-auto">
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
        ))
        }
      </div>
    </Card>
  );
}
