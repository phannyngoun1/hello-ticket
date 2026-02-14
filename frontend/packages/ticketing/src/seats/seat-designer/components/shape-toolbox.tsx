import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@truths/ui";
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
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  RectangleHorizontal,
  RectangleVertical,
  MoreHorizontal,
  Armchair,
  Presentation,
  LayoutTemplate,
  Pill,
} from "lucide-react";
import {
  PlacementShapeType,
  type SeatMarker,
  type SectionMarker,
} from "../types";
import { cn } from "@truths/ui/lib/utils";
import { DEFAULT_SHAPE_FILL, DEFAULT_SHAPE_STROKE } from "../colors";

/**
 * A number input that only commits its value on blur (or Enter key).
 * This prevents every keystroke from triggering expensive style changes.
 */
function BlurNumberInput({
  value,
  onCommit,
  min,
  max,
  step,
  fallback,
  className,
  title,
  "aria-label": ariaLabel,
}: {
  value: number;
  onCommit: (value: number) => void;
  min?: string;
  max?: string;
  step?: string;
  fallback: number;
  className?: string;
  title?: string;
  "aria-label"?: string;
}) {
  const [localValue, setLocalValue] = useState<string>(String(value));

  // Sync local value when external value changes (e.g. different marker selected)
  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const commit = useCallback(() => {
    const parsed = parseFloat(localValue);
    const final = isNaN(parsed) ? fallback : parsed;
    onCommit(final);
    setLocalValue(String(final));
  }, [localValue, fallback, onCommit]);

  return (
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={className}
      title={title}
      aria-label={ariaLabel}
    />
  );
}

const ALL_SHAPES = [
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
    icon: Circle, // Using Circle as proxy for Ellipse if Ellipse icon n/a
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
    label: "Freeform",
  },
  {
    type: PlacementShapeType.SOFA,
    icon: Armchair,
    label: "Sofa",
  },
  {
    type: PlacementShapeType.STAGE,
    icon: Presentation,
    label: "Stage",
  },
  {
    type: PlacementShapeType.SEAT,
    icon: Pill,
    label: "Seat",
  },
];

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
    style: {
      fillColor?: string;
      strokeColor?: string;
      width?: number;
      height?: number;
      radius?: number;
      rotation?: number;
    },
  ) => void;
  onSectionShapeStyleChange?: (
    sectionId: string,
    style: {
      fillColor?: string;
      strokeColor?: string;
      width?: number;
      height?: number;
      radius?: number;
      rotation?: number;
    },
  ) => void;
  /** Called when user aligns multiple selected markers. Only shown when 2+ selected. */
  onAlign?: (
    alignment:
      | "left"
      | "center"
      | "right"
      | "top"
      | "middle"
      | "bottom"
      | "space-between-h"
      | "space-between-v"
      | "space-between-both"
      | "same-width"
      | "same-height",
  ) => void;
  /** Number of selected seats (for alignment UI) */
  selectedSeatCount?: number;
  /** Number of selected sections (for alignment UI) */
  selectedSectionCount?: number;
  /** Compact seat placement controls rendered after shapes and seat info */
  seatPlacementControls?: React.ReactNode;
  /** Inline seat edit controls - when provided and selectedSeat, replaces marker name + View/Edit/Delete */
  seatEditControls?: React.ReactNode;
  className?: string;
  readOnly?: boolean;
  level?: "seat" | "section";
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
  onAlign,
  selectedSeatCount = 0,
  selectedSectionCount = 0,
  seatPlacementControls,
  seatEditControls,
  className,
  readOnly = false,
  level = "seat",
}: ShapeToolboxProps) {
  const totalSelected = selectedSeatCount + selectedSectionCount;
  const showAlignment = !readOnly && onAlign && totalSelected >= 2;

  // Persist quick access shapes in local storage or just state? State is fine for now.
  // Defaults: Circle, Rectangle, Ellipse, Polygon
  const [quickAccessShapes, setQuickAccessShapes] = useState<
    PlacementShapeType[]
  >([
    PlacementShapeType.CIRCLE,
    PlacementShapeType.RECTANGLE,
    PlacementShapeType.ELLIPSE,
    PlacementShapeType.POLYGON,
  ]);

  const handleShapeDrop = (index: number, shapeType: PlacementShapeType) => {
    const newShapes = [...quickAccessShapes];
    newShapes[index] = shapeType;
    setQuickAccessShapes(newShapes);
  };

  // State to control popover open status
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleShapeDoubleClick = (newShapeType: PlacementShapeType) => {
    // If the currently selected shape is in the toolbar, replace it.
    // Otherwise replace the last slot.
    const selectedIndex = selectedShapeType
      ? quickAccessShapes.indexOf(selectedShapeType)
      : -1;

    const targetIndex = selectedIndex !== -1 ? selectedIndex : 3;

    const newShapes = [...quickAccessShapes];
    newShapes[targetIndex] = newShapeType;
    setQuickAccessShapes(newShapes);

    // Select the new shape
    onShapeTypeSelect?.(newShapeType);

    // Close popover
    setIsPopoverOpen(false);
  };

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
      ? (style: {
          fillColor?: string;
          strokeColor?: string;
          width?: number;
          height?: number;
          radius?: number;
          rotation?: number;
        }) => onSeatShapeStyleChange(selectedSeat.id, style)
      : selectedSection && onSectionShapeStyleChange
        ? (style: {
            fillColor?: string;
            strokeColor?: string;
            width?: number;
            height?: number;
            radius?: number;
            rotation?: number;
          }) => onSectionShapeStyleChange(selectedSection.id, style)
        : undefined;
  const showColorControls =
    !readOnly &&
    selectedMarker &&
    onStyleChange &&
    (selectedSeat || (selectedSection && selectedSection.shape));

  /** When in edit mode (seat edit controls shown), hide shapes, placement, and color controls */
  const isEditMode = !!(selectedSeat && seatEditControls);

  return (
    <Card className={cn("px-3 py-2.5", className)}>
      <div className="flex items-center gap-3 flex-wrap w-full">
        {!isEditMode && (
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
                  !readOnly &&
                    "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95",
                  readOnly && "opacity-50 cursor-not-allowed",
                  !selectedShapeType && !readOnly
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background border-border",
                )}
                title="Pointer (Select)"
              >
                <MousePointer2 className="h-3.5 w-3.5 transition-transform duration-200" />
              </button>

              {/* Quick Access Shapes */}
              {quickAccessShapes.map((shapeType, index) => {
                if (
                  level === "section" &&
                  shapeType === PlacementShapeType.SEAT
                ) {
                  return null;
                }
                const shapeDef =
                  ALL_SHAPES.find((s) => s.type === shapeType) || ALL_SHAPES[0];
                const Icon = shapeDef.icon;
                const isSelected = selectedShapeType === shapeType;
                return (
                  <button
                    key={`${shapeType}-${index}`}
                    type="button"
                    draggable={!readOnly}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "copy";
                      e.dataTransfer.setData(
                        "application/json",
                        JSON.stringify({
                          shapeType: shapeType,
                          dragSource: "shape-toolbox",
                        }),
                      );
                      // Set a drag image
                      const dragImage = new Image();
                      // Simple circle SVG for drag image
                      dragImage.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%235b21b6' stroke='%235b21b6'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E";
                      e.dataTransfer.setDragImage(dragImage, 12, 12);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "copy";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const data = e.dataTransfer.getData("application/json");
                      if (data) {
                        try {
                          const parsed = JSON.parse(data);
                          if (
                            parsed.dragSource === "shape-library" &&
                            parsed.shapeType
                          ) {
                            handleShapeDrop(
                              index,
                              parsed.shapeType as PlacementShapeType,
                            );
                          }
                        } catch (err) {
                          // ignore
                        }
                      }
                    }}
                    onDragEnd={(e) => {
                      e.dataTransfer.dropEffect = "copy";
                    }}
                    onClick={() => {
                      onShapeTypeSelect?.(shapeType);
                    }}
                    disabled={readOnly || !onShapeTypeSelect}
                    className={cn(
                      "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                      !readOnly &&
                        "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95 cursor-grab active:cursor-grabbing",
                      readOnly && "opacity-50 cursor-not-allowed",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background border-border",
                    )}
                    title={`${shapeDef.label} (drag to canvas to place, drop from More to replace)`}
                  >
                    <Icon className="h-3.5 w-3.5 transition-transform duration-200" />
                  </button>
                );
              })}

              {/* More Shapes Popover */}
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={readOnly}
                    className={cn(
                      "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                      !readOnly &&
                        "hover:bg-accent hover:border-accent-foreground hover:shadow-md active:scale-95",
                      readOnly && "opacity-50 cursor-not-allowed",
                      "bg-background border-border",
                    )}
                    title="More Shapes (drag to toolbox to customize)"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5 transition-transform duration-200" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Available Shapes
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {ALL_SHAPES.filter((s) => {
                        // Filter out shapes already in quick access
                        if (quickAccessShapes.includes(s.type)) return false;

                        // Filter out shapes based on level
                        if (
                          level === "section" &&
                          (s.type === PlacementShapeType.SOFA ||
                            s.type === PlacementShapeType.SEAT)
                        )
                          return false;

                        return true;
                      }).map((shape) => {
                        const Icon = shape.icon;
                        return (
                          <button
                            key={shape.type}
                            type="button"
                            draggable={!readOnly}
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = "copy";
                              e.dataTransfer.setData(
                                "application/json",
                                JSON.stringify({
                                  shapeType: shape.type,
                                  dragSource: "shape-library",
                                }),
                              );
                            }}
                            onClick={() => {
                              // Select it temporarily? logic for "replace checked" could be here
                              // For now just select it.
                              onShapeTypeSelect?.(shape.type);
                            }}
                            onDoubleClick={() =>
                              handleShapeDoubleClick(shape.type)
                            }
                            className={cn(
                              "flex flex-col items-center justify-center p-2 rounded border transition-all gap-1 h-16",
                              "hover:bg-accent hover:border-accent-foreground cursor-grab active:cursor-grabbing",
                              selectedShapeType === shape.type &&
                                "bg-accent border-accent-foreground",
                            )}
                            title={`${shape.label} - Double click to add to toolbar`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-[10px] truncate w-full text-center">
                              {shape.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Drag to toolbar or double-click to pin.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* Alignment tools - shown when 2+ markers selected */}
        {showAlignment && (
          <div className="flex items-center gap-1 border-l pl-2.5">
            <div className="text-xs font-medium text-muted-foreground shrink-0">
              Align:
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onAlign?.("left")}
                className={cn(
                  "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                  "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95",
                  "bg-background border-border",
                )}
                title="Align left"
              >
                <AlignStartVertical className="h-3.5 w-3.5 transition-transform duration-200" />
              </button>
              <button
                type="button"
                onClick={() => onAlign?.("center")}
                className={cn(
                  "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                  "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95",
                  "bg-background border-border",
                )}
                title="Align center"
              >
                <AlignCenterVertical className="h-3.5 w-3.5 transition-transform duration-200" />
              </button>
              <button
                type="button"
                onClick={() => onAlign?.("right")}
                className={cn(
                  "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                  "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95",
                  "bg-background border-border",
                )}
                title="Align right"
              >
                <AlignEndVertical className="h-3.5 w-3.5 transition-transform duration-200" />
              </button>
              <button
                type="button"
                onClick={() => onAlign?.("top")}
                className={cn(
                  "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                  "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95",
                  "bg-background border-border",
                )}
                title="Align top"
              >
                <AlignStartHorizontal className="h-3.5 w-3.5 transition-transform duration-200" />
              </button>
              <button
                type="button"
                onClick={() => onAlign?.("middle")}
                className={cn(
                  "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                  "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95",
                  "bg-background border-border",
                )}
                title="Align middle"
              >
                <AlignCenterHorizontal className="h-3.5 w-3.5 transition-transform duration-200" />
              </button>
              <button
                type="button"
                onClick={() => onAlign?.("bottom")}
                className={cn(
                  "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                  "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95",
                  "bg-background border-border",
                )}
                title="Align bottom"
              >
                <AlignEndHorizontal className="h-3.5 w-3.5 transition-transform duration-200" />
              </button>
              <div className="w-px h-5 bg-border shrink-0" aria-hidden />
              <button
                type="button"
                onClick={() => onAlign?.("space-between-h")}
                className={cn(
                  "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                  "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95",
                  "bg-background border-border",
                )}
                title="Space between horizontally"
              >
                <AlignHorizontalSpaceBetween className="h-3.5 w-3.5 transition-transform duration-200" />
              </button>
              <button
                type="button"
                onClick={() => onAlign?.("space-between-v")}
                className={cn(
                  "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                  "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95",
                  "bg-background border-border",
                )}
                title="Space between vertically"
              >
                <AlignVerticalSpaceBetween className="h-3.5 w-3.5 transition-transform duration-200" />
              </button>
              <button
                type="button"
                onClick={() => onAlign?.("space-between-both")}
                className={cn(
                  "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                  "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95",
                  "bg-background border-border",
                )}
                title="Spread (space between horizontally and vertically)"
              >
                <LayoutTemplate className="h-3.5 w-3.5 transition-transform duration-200" />
              </button>
              <button
                type="button"
                onClick={() => onAlign?.("same-width")}
                className={cn(
                  "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                  "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95",
                  "bg-background border-border",
                )}
                title="Same width"
              >
                <RectangleHorizontal className="h-3.5 w-3.5 transition-transform duration-200" />
              </button>
              <button
                type="button"
                onClick={() => onAlign?.("same-height")}
                className={cn(
                  "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out",
                  "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95",
                  "bg-background border-border",
                )}
                title="Same height"
              >
                <RectangleVertical className="h-3.5 w-3.5 transition-transform duration-200" />
              </button>
            </div>
          </div>
        )}

        {/* Compact seat placement controls - hidden when pointer selected or an object is selected (only shown with active shape tool) */}
        {!isEditMode &&
          !selectedMarker &&
          selectedShapeType &&
          seatPlacementControls && (
            <div className="flex items-center gap-2 border-l pl-2.5">
              {seatPlacementControls}
            </div>
          )}

        {/* Fill and border color - in line with shapes when a seat or section (with shape) is selected */}
        {!isEditMode && showColorControls && (
          <div className="hidden flex items-center gap-2 border-l pl-2.5">
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground shrink-0 w-7">
                Fill
              </Label>
              <input
                type="color"
                aria-label="Fill color"
                title="Fill color"
                value={markerShape?.fillColor?.trim() || DEFAULT_SHAPE_FILL}
                onChange={(e) => onStyleChange?.({ fillColor: e.target.value })}
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
              <Label className="text-xs text-muted-foreground shrink-0 w-12">
                Border
              </Label>
              <input
                type="color"
                aria-label="Border color"
                title="Border color"
                value={markerShape?.strokeColor?.trim() || DEFAULT_SHAPE_STROKE}
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
                "bg-background border-border",
              )}
              title="Reset to default colors"
              aria-label="Reset to default colors"
            >
              <RotateCcw className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Manual size controls for shapes - shown when a seat or section is selected */}
        {!isEditMode && markerShape && (
          <div className="flex items-center gap-2 border-l pl-2.5">
            {markerShape.type === PlacementShapeType.CIRCLE ? (
              // Radius control for circles
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground shrink-0">
                  Radius
                </Label>
                <BlurNumberInput
                  min="0.1"
                  max="50"
                  step="0.1"
                  value={markerShape.radius || 1.2}
                  onCommit={(v) => onStyleChange?.({ radius: v })}
                  fallback={1.2}
                  className="h-6 w-16 font-mono text-[11px] py-0 px-1"
                  title="Radius as % of canvas"
                  aria-label="Circle radius"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            ) : (
              // Width and height controls for rectangles/ellipses
              <>
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground shrink-0">
                    W
                  </Label>
                  <BlurNumberInput
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={markerShape.width || 3}
                    onCommit={(v) => onStyleChange?.({ width: v })}
                    fallback={3}
                    className="h-6 w-16 font-mono text-[11px] py-0 px-1"
                    title="Width as % of canvas"
                    aria-label="Shape width"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground shrink-0">
                    H
                  </Label>
                  <BlurNumberInput
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={markerShape.height || 2}
                    onCommit={(v) => onStyleChange?.({ height: v })}
                    fallback={2}
                    className="h-6 w-16 font-mono text-[11px] py-0 px-1"
                    title="Height as % of canvas"
                    aria-label="Shape height"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </>
            )}
            {/* Rotation control - shown for all shapes */}
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground shrink-0">
                R
              </Label>
              <BlurNumberInput
                min="0"
                max="360"
                step="1"
                value={markerShape.rotation || 0}
                onCommit={(v) => onStyleChange?.({ rotation: v })}
                fallback={0}
                className="h-6 w-10 font-mono text-[11px] py-0 px-1"
                title="Rotation in degrees"
                aria-label="Shape rotation"
              />
              <span className="text-xs text-muted-foreground">°</span>
            </div>
          </div>
        )}

        {/* Inline seat edit controls - replaces marker name when editing seat */}
        {selectedSeat && seatEditControls
          ? seatEditControls
          : /* Selected marker name with view, edit and delete actions */
            selectedMarker &&
            markerName && (
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
                      "bg-background border-border",
                    )}
                    title={
                      selectedSection
                        ? "Open section detail"
                        : "View seat details"
                    }
                    aria-label={
                      selectedSection
                        ? "Open section detail"
                        : "View seat details"
                    }
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
                      "bg-background border-border",
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
                      "bg-background border-border",
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
