import { Input, Label } from "@truths/ui";
import { RotateCcw } from "lucide-react";
import { cn } from "@truths/ui/lib/utils";
import { DEFAULT_SHAPE_FILL, DEFAULT_SHAPE_STROKE } from "../../colors";
import type { ShapeToolboxStyle } from "./types";

interface ColorControlsSectionProps {
  markerShape?: ShapeToolboxStyle | null;
  onStyleChange?: (style: Partial<ShapeToolboxStyle>) => void;
}

export function ColorControlsSection({
  markerShape,
  onStyleChange,
}: ColorControlsSectionProps) {
  return (
    <div className="flex items-center gap-2 border-l pl-2.5">
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
  );
}
