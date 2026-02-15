/**
 * Grid lines overlay for the floor plan canvas
 */

import React from "react";
import { Line } from "react-konva";

const GRID_LINE_STYLE = {
  stroke: "rgba(100, 150, 255, 0.2)" as const,
  strokeWidth: 1,
  dash: [2, 2] as [number, number],
};

export interface GridLinesProps {
  gridSize: number;
  validWidth: number;
  validHeight: number;
}

export function GridLines({
  gridSize,
  validWidth,
  validHeight,
}: GridLinesProps) {
  const gridLines: Array<{ x1: number; y1: number; x2: number; y2: number }> =
    [];

  for (let p = gridSize; p < 100; p += gridSize) {
    const x = (p / 100) * validWidth;
    gridLines.push({ x1: x, y1: 0, x2: x, y2: validHeight });
  }
  for (let p = gridSize; p < 100; p += gridSize) {
    const y = (p / 100) * validHeight;
    gridLines.push({ x1: 0, y1: y, x2: validWidth, y2: y });
  }

  return (
    <>
      {gridLines.map((line, index) => (
        <Line
          key={`grid-line-${index}`}
          points={[line.x1, line.y1, line.x2, line.y2]}
          stroke={GRID_LINE_STYLE.stroke}
          strokeWidth={GRID_LINE_STYLE.strokeWidth}
          perfectDrawEnabled={false}
          dash={GRID_LINE_STYLE.dash}
        />
      ))}
    </>
  );
}
