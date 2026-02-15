import { Label } from "@truths/ui";
import { PlacementShapeType } from "../../types";
import { BlurNumberInput } from "./blur-number-input";
import type { ShapeToolboxStyle } from "./types";

interface SizeControlsSectionProps {
  markerShape: ShapeToolboxStyle & { type?: PlacementShapeType };
  onStyleChange?: (style: Partial<ShapeToolboxStyle>) => void;
}

export function SizeControlsSection({
  markerShape,
  onStyleChange,
}: SizeControlsSectionProps) {
  return (
    <div className="flex items-center gap-2 border-l pl-2.5">
      {markerShape.type === PlacementShapeType.CIRCLE ? (
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
  );
}
