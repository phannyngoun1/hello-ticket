import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@truths/ui";
import { Label } from "@truths/ui";
import { MousePointer2, MoreHorizontal } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { PlacementShapeType } from "../../types";
import {
  ALL_SHAPES,
  TOOLBAR_BUTTON,
  TOOLBAR_BUTTON_HOVER,
} from "./constants";

interface ShapeToolbarSectionProps {
  selectedShapeType: PlacementShapeType | null;
  onShapeTypeSelect: (shapeType: PlacementShapeType | null) => void;
  readOnly: boolean;
  level: "seat" | "section";
}

export function ShapeToolbarSection({
  selectedShapeType,
  onShapeTypeSelect,
  readOnly,
  level,
}: ShapeToolbarSectionProps) {
  const [quickAccessShapes, setQuickAccessShapes] = useState<
    PlacementShapeType[]
  >([
    PlacementShapeType.CIRCLE,
    PlacementShapeType.RECTANGLE,
    PlacementShapeType.ELLIPSE,
    PlacementShapeType.POLYGON,
  ]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleShapeDrop = (index: number, shapeType: PlacementShapeType) => {
    const newShapes = [...quickAccessShapes];
    newShapes[index] = shapeType;
    setQuickAccessShapes(newShapes);
  };

  const handleShapeDoubleClick = (newShapeType: PlacementShapeType) => {
    const selectedIndex = selectedShapeType
      ? quickAccessShapes.indexOf(selectedShapeType)
      : -1;
    const targetIndex = selectedIndex !== -1 ? selectedIndex : 3;
    const newShapes = [...quickAccessShapes];
    newShapes[targetIndex] = newShapeType;
    setQuickAccessShapes(newShapes);
    onShapeTypeSelect?.(newShapeType);
    setIsPopoverOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        Shapes:
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onShapeTypeSelect?.(null)}
          disabled={readOnly || !onShapeTypeSelect}
          className={cn(
            TOOLBAR_BUTTON,
            !readOnly && TOOLBAR_BUTTON_HOVER,
            readOnly && "opacity-50 cursor-not-allowed",
            !selectedShapeType && !readOnly
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background border-border",
          )}
          title="Pointer (Select)"
        >
          <MousePointer2 className="h-3.5 w-3.5 transition-transform duration-200" />
        </button>

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
                const dragImage = new Image();
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
                  } catch {
                    // ignore
                  }
                }
              }}
              onDragEnd={(e) => {
                e.dataTransfer.dropEffect = "copy";
              }}
              onClick={() => onShapeTypeSelect?.(shapeType)}
              disabled={readOnly || !onShapeTypeSelect}
              className={cn(
                TOOLBAR_BUTTON,
                !readOnly && cn(TOOLBAR_BUTTON_HOVER, "cursor-grab active:cursor-grabbing"),
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

        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={readOnly}
              className={cn(
                TOOLBAR_BUTTON,
                !readOnly && "hover:bg-accent hover:border-accent-foreground hover:shadow-md active:scale-95",
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
                  if (quickAccessShapes.includes(s.type)) return false;
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
                      onClick={() => onShapeTypeSelect?.(shape.type)}
                      onDoubleClick={() => handleShapeDoubleClick(shape.type)}
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
  );
}
