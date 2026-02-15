/**
 * Zoom Controls Component
 * 
 * Reusable zoom control buttons for the canvas
 */

import { Button } from "@truths/ui";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export interface ZoomControlsProps {
  zoomLevel: number;
  panOffset: { x: number; y: number };
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export function ZoomControls({
  zoomLevel,
  panOffset,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: ZoomControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomIn}
        disabled={zoomLevel >= 3}
        title="Zoom In"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomOut}
        disabled={zoomLevel <= 0.5}
        title="Zoom Out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onResetZoom}
        disabled={zoomLevel === 1 && panOffset.x === 0 && panOffset.y === 0}
        title="Reset Zoom"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      <div className="text-xs text-center text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {Math.round(zoomLevel * 100)}%
      </div>
    </div>
  );
}

