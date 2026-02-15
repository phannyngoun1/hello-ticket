/**
 * Static markers layer: non-selected seats, sections, and shape overlays
 */

import React from "react";
import { Layer } from "react-konva";
import { PlacementShapeType } from "../types";
import { MemoizedSeatMarkerCanvas } from "../canvas/seat-marker-canvas";
import { MemoizedSectionMarkerCanvas } from "../canvas/section-marker-canvas";
import { MemoizedShapeOverlayCanvas } from "../canvas/shape-overlay-canvas";
import type { StaticMarkersLayerProps } from "./types";

export function StaticMarkersLayer({
  layer: { layerTransform },
  data: {
    staticSeats,
    staticSections,
    visibleShapeOverlays,
    designMode,
  },
  selection: {
    selectedSeatIdSet,
    selectedSectionIdSet,
    selectedOverlayId,
  },
  canvas: {
    percentageToStage,
    layerToPercentage,
    displayedWidth,
    displayedHeight,
  },
  display: {
    useLowDetail,
    disableHoverAnimation,
    readOnly,
    selectedShapeTool,
  },
  drag: {
    draggedSeatId,
    draggedSectionId,
    dragPosition,
  },
  handlers,
  colors: { getSeatMarkerColors, getSectionMarkerColors },
}: StaticMarkersLayerProps) {
  return (
    <Layer {...layerTransform} listening={true}>
      {staticSeats.map((seat) => {
        const pos =
          seat.id === draggedSeatId && dragPosition
            ? dragPosition
            : { x: seat.x, y: seat.y };
        const { x, y } = percentageToStage(pos.x, pos.y);
        const seatColors = getSeatMarkerColors(seat);
        return (
          <MemoizedSeatMarkerCanvas
            key={seat.id}
            seat={seat}
            position={{ x, y }}
            selection={{ isSelected: selectedSeatIdSet.has(seat.id) }}
            interaction={{
              isPlacingSeats: handlers.isPlacingSeats ?? false,
              isPanning: handlers.isPanning ?? false,
              isSpacePressed: handlers.isSpacePressed ?? false,
              isPlacingSections: handlers.isPlacingSections ?? false,
              selectedShapeTool,
            }}
            handlers={{
              onSeatClick: handlers.onSeatClick,
              onSeatDragStart: handlers.onSeatDragStart,
              onSeatDragMove: handlers.onSeatDragMove,
              onSeatDragEnd: handlers.onSeatDragEnd,
              onShapeTransform: handlers.onSeatShapeTransform,
            }}
            canvas={{
              layerToPercentage,
              imageWidth: displayedWidth,
              imageHeight: displayedHeight,
            }}
            display={{
              readOnly,
              disableHoverAnimation,
              useLowDetail,
              colors: seatColors,
            }}
          />
        );
      })}
      {designMode === "section-level" &&
        staticSections.map((section) => {
          const pos =
            section.id === draggedSectionId && dragPosition
              ? dragPosition
              : { x: section.x, y: section.y };
          const { x, y } = percentageToStage(pos.x, pos.y);
          return (
            <MemoizedSectionMarkerCanvas
              key={section.id}
              section={section}
              position={{ x, y }}
              selection={{
                isSelected: selectedSectionIdSet.has(section.id),
              }}
              interaction={{
                isPlacingSections: handlers.isPlacingSections ?? false,
                isPanning: handlers.isPanning ?? false,
                isSpacePressed: handlers.isSpacePressed ?? false,
                isPlacingSeats: handlers.isPlacingSeats ?? false,
                selectedShapeTool,
              }}
              handlers={{
                onSectionClick: handlers.onSectionClick,
                onSectionDoubleClick: handlers.onSectionDoubleClick,
                onSectionDragEnd: handlers.onSectionDragEnd,
                onSectionDragMove: handlers.onSectionDragMove,
                onSectionDragStart: handlers.onSectionDragStart,
                onShapeTransform: handlers.onSectionShapeTransform,
              }}
              canvas={{
                layerToPercentage,
                imageWidth: displayedWidth,
                imageHeight: displayedHeight,
              }}
              display={{
                readOnly,
                disableHoverAnimation,
                useLowDetail,
                colors: getSectionMarkerColors(section),
              }}
            />
          );
        })}
      {visibleShapeOverlays.map((overlay) => {
        const isSelected = selectedOverlayId === overlay.id;
        return (
          <MemoizedShapeOverlayCanvas
            key={overlay.id}
            overlay={overlay}
            selection={{ isSelected }}
            handlers={{ onShapeOverlayClick: handlers.onShapeOverlayClick }}
            canvas={{
              imageWidth: displayedWidth,
              imageHeight: displayedHeight,
              percentageToStage,
            }}
            interaction={{
              isPanning: handlers.isPanning ?? false,
              isSpacePressed: handlers.isSpacePressed ?? false,
              selectedShapeTool,
              isPlacingSeats: handlers.isPlacingSeats ?? false,
              isPlacingSections: handlers.isPlacingSections ?? false,
            }}
            display={{ disableHoverAnimation }}
          />
        );
      })}
    </Layer>
  );
}
