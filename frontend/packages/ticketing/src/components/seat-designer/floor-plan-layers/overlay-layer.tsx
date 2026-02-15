/**
 * Overlay layer: preview shapes, freeform lines, etc.
 */

import React from "react";
import { Layer, Rect } from "react-konva";
import { PlacementShapeType } from "../types";
import { FreeformPreviewLines } from "./freeform-preview-lines";
import { DrawingPreviewShape } from "./drawing-preview-shape";
import type { OverlayLayerProps } from "./types";

export function OverlayLayer({
  layerTransform,
  imageX,
  imageY,
  displayedWidth,
  displayedHeight,
  selectedShapeTool,
  freeformPath,
  freeformHoverPos,
  isDrawingShape,
  drawStartPos,
  drawCurrentPos,
  percentageToStage,
  previewShapeRef,
  onOverlayLayerClick,
}: OverlayLayerProps) {
  return (
    <Layer
      {...layerTransform}
      listening={true}
      onClick={onOverlayLayerClick}
    >
      <Rect
        x={imageX}
        y={imageY}
        width={displayedWidth}
        height={displayedHeight}
        fill="transparent"
        listening={false}
      />

      {selectedShapeTool === PlacementShapeType.FREEFORM &&
        freeformPath.length > 0 && (
          <FreeformPreviewLines
            freeformPath={freeformPath}
            freeformHoverPos={freeformHoverPos}
            percentageToStage={percentageToStage}
          />
        )}

      {isDrawingShape &&
        drawStartPos &&
        drawCurrentPos &&
        selectedShapeTool &&
        selectedShapeTool !== PlacementShapeType.FREEFORM && (
          <DrawingPreviewShape
            drawStartPos={drawStartPos}
            drawCurrentPos={drawCurrentPos}
            selectedShapeTool={selectedShapeTool}
            percentageToStage={percentageToStage}
            displayedWidth={displayedWidth}
            displayedHeight={displayedHeight}
            previewShapeRef={previewShapeRef}
          />
        )}
    </Layer>
  );
}
