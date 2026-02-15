/**
 * Freeform drawing preview: lines between points + dashed line to cursor
 */

import React from "react";
import { Line } from "react-konva";

const FREEFORM_LINE_STYLE = {
  stroke: "#3b82f6" as const,
  strokeWidth: 1.5,
  opacity: 0.8,
  dash: [5, 5] as [number, number],
};

export interface FreeformPreviewLinesProps {
  freeformPath: Array<{ x: number; y: number }>;
  freeformHoverPos: { x: number; y: number } | null;
  percentageToStage: (x: number, y: number) => { x: number; y: number };
}

export function FreeformPreviewLines({
  freeformPath,
  freeformHoverPos,
  percentageToStage,
}: FreeformPreviewLinesProps) {
  const lines: Array<{
    points: number[];
    x: number;
    y: number;
    dashed?: boolean;
  }> = [];

  for (let i = 0; i < freeformPath.length - 1; i++) {
    const a = percentageToStage(freeformPath[i].x, freeformPath[i].y);
    const b = percentageToStage(freeformPath[i + 1].x, freeformPath[i + 1].y);
    lines.push({
      points: [0, 0, b.x - a.x, b.y - a.y],
      x: a.x,
      y: a.y,
    });
  }
  if (freeformHoverPos) {
    const last = percentageToStage(
      freeformPath[freeformPath.length - 1].x,
      freeformPath[freeformPath.length - 1].y,
    );
    const hover = percentageToStage(freeformHoverPos.x, freeformHoverPos.y);
    lines.push({
      points: [0, 0, hover.x - last.x, hover.y - last.y],
      x: last.x,
      y: last.y,
      dashed: true,
    });
  }

  return (
    <>
      {lines.map((line, i) => (
        <Line
          key={`freeform-${i}`}
          points={line.points}
          x={line.x}
          y={line.y}
          stroke={FREEFORM_LINE_STYLE.stroke}
          strokeWidth={FREEFORM_LINE_STYLE.strokeWidth}
          opacity={FREEFORM_LINE_STYLE.opacity}
          dash={line.dashed ? FREEFORM_LINE_STYLE.dash : undefined}
        />
      ))}
    </>
  );
}
