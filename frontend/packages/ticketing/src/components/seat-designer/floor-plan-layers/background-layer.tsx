/**
 * Background layer: grid lines, canvas background, and floor plan image
 */

import React from "react";
import Konva from "konva";
import { Layer, Group, Image, Rect } from "react-konva";
import type { BackgroundLayerProps } from "./types";
import { GridLines } from "./grid-lines";

export function BackgroundLayer({
  layerRef,
  layerTransform,
  showGrid,
  gridSize,
  validWidth,
  validHeight,
  imageX,
  imageY,
  displayedWidth,
  displayedHeight,
  canvasBackgroundColor,
  image,
  onBackgroundMouseMove,
  onBackgroundClick,
  onBackgroundDblClick,
  onBackgroundTap,
}: BackgroundLayerProps) {
  return (
    <Layer
      ref={layerRef as React.RefObject<Konva.Layer>}
      {...layerTransform}
      listening={true}
    >
      {showGrid && gridSize > 0 && (
        <Group listening={false}>
          <GridLines
            gridSize={gridSize}
            validWidth={validWidth}
            validHeight={validHeight}
          />
        </Group>
      )}
      <Rect
        name="canvas-background"
        x={imageX}
        y={imageY}
        width={displayedWidth}
        height={displayedHeight}
        fill={canvasBackgroundColor}
        listening={false}
      />
      {image ? (
        <Image
          name="background-image"
          image={image}
          x={imageX}
          y={imageY}
          width={displayedWidth}
          height={displayedHeight}
          listening={true}
          onMouseMove={onBackgroundMouseMove}
          onClick={onBackgroundClick}
          onDblClick={onBackgroundDblClick}
          onTap={onBackgroundTap}
        />
      ) : (
        <Rect
          name="background-image"
          x={imageX}
          y={imageY}
          width={displayedWidth}
          height={displayedHeight}
          fill={canvasBackgroundColor}
          listening={true}
          onMouseMove={onBackgroundMouseMove}
          onClick={onBackgroundClick}
          onDblClick={onBackgroundDblClick}
          onTap={onBackgroundTap}
        />
      )}
      <Rect
        name="canvas-border"
        x={imageX}
        y={imageY}
        width={displayedWidth}
        height={displayedHeight}
        fill="transparent"
        stroke="rgba(100, 116, 139, 0.4)"
        strokeWidth={1.5}
        listening={false}
      />
    </Layer>
  );
}
