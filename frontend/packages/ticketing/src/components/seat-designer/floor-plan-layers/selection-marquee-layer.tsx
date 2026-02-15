/**
 * Selection marquee layer: drag-to-select rectangle
 */

import React from "react";
import { Layer, Rect } from "react-konva";
import { MARQUEE_FILL, MARQUEE_STROKE } from "../colors";
import type { SelectionMarqueeLayerProps } from "./types";

export function SelectionMarqueeLayer({
  selectionStart,
  selectionCurrent,
  stroke = MARQUEE_STROKE,
  fill = MARQUEE_FILL,
}: SelectionMarqueeLayerProps) {
  return (
    <Layer listening={false}>
      <Rect
        x={Math.min(selectionStart.x, selectionCurrent.x)}
        y={Math.min(selectionStart.y, selectionCurrent.y)}
        width={Math.abs(selectionCurrent.x - selectionStart.x)}
        height={Math.abs(selectionCurrent.y - selectionStart.y)}
        stroke={stroke}
        strokeWidth={1}
        dash={[6, 4]}
        fill={fill}
      />
    </Layer>
  );
}
