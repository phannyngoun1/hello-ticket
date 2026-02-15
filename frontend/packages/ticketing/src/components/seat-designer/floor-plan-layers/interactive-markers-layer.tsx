/**
 * Interactive markers layer: selected seats/sections and dragged items
 */

import React from "react";
import { Layer } from "react-konva";
import { MemoizedSeatMarkerCanvas } from "../canvas/seat-marker-canvas";
import { MemoizedSectionMarkerCanvas } from "../canvas/section-marker-canvas";
import type { InteractiveMarkersLayerProps } from "./types";

export function InteractiveMarkersLayer({
  layerTransform,
  selectedSeats,
  selectedSections,
  draggedSeat,
  draggedSection,
  designMode,
  percentageToStage,
  layerToPercentage,
  displayedWidth,
  displayedHeight,
  disableHoverAnimation,
  readOnly,
  selectedShapeTool,
  dragPosition,
  handlers,
  getSeatMarkerColors,
  getSectionMarkerColors,
}: InteractiveMarkersLayerProps) {
  const selectedSeatIdSet = new Set(selectedSeats.map((s) => s.id));
  const selectedSectionIdSetForSections = new Set(
    selectedSections.map((s) => s.id),
  );

  return (
    <Layer {...layerTransform} listening={true}>
      {selectedSeats.map((seat) => {
        const pos =
          seat.id === (draggedSeat?.id ?? null) && dragPosition
            ? dragPosition
            : { x: seat.x, y: seat.y };
        const { x, y } = percentageToStage(pos.x, pos.y);
        const colors = getSeatMarkerColors(seat);
        return (
          <MemoizedSeatMarkerCanvas
            key={seat.id}
            seat={seat}
            position={{ x, y }}
            selection={{ isSelected: true }}
            interaction={{
              isPlacingSeats: handlers.isPlacingSeats,
              isPanning: handlers.isPanning,
              isSpacePressed: handlers.isSpacePressed,
              isPlacingSections: handlers.isPlacingSections,
              selectedShapeTool,
            }}
            handlers={{
              onSeatClick: handlers.onSeatClick,
              onSeatDragStart: handlers.onSeatDragStart,
              onSeatDragMove: handlers.onSeatDragMove,
              onSeatDragEnd: handlers.onSeatDragEnd,
              onShapeTransform: handlers.onSeatShapeTransform,
              onTransformProgress: handlers.onTransformProgress,
            }}
            canvas={{
              layerToPercentage,
              imageWidth: displayedWidth,
              imageHeight: displayedHeight,
            }}
            display={{
              readOnly,
              disableHoverAnimation,
              useLowDetail: false,
              colors,
            }}
          />
        );
      })}
      {designMode === "section-level" &&
        selectedSections.map((section) => {
          const pos =
            section.id === (draggedSection?.id ?? null) && dragPosition
              ? dragPosition
              : { x: section.x, y: section.y };
          const { x, y } = percentageToStage(pos.x, pos.y);
          return (
            <MemoizedSectionMarkerCanvas
              key={section.id}
              section={section}
              position={{ x, y }}
              selection={{ isSelected: true }}
              interaction={{
                isPlacingSections: handlers.isPlacingSections,
                isPanning: handlers.isPanning,
                isSpacePressed: handlers.isSpacePressed,
                isPlacingSeats: handlers.isPlacingSeats,
                selectedShapeTool,
              }}
              handlers={{
                onSectionClick: handlers.onSectionClick,
                onSectionDoubleClick: handlers.onSectionDoubleClick,
                onSectionDragEnd: handlers.onSectionDragEnd,
                onSectionDragMove: handlers.onSectionDragMove,
                onSectionDragStart: handlers.onSectionDragStart,
                onShapeTransform: handlers.onSectionShapeTransform,
                onTransformProgress: handlers.onTransformProgress,
              }}
              canvas={{
                layerToPercentage,
                imageWidth: displayedWidth,
                imageHeight: displayedHeight,
              }}
              display={{
                readOnly,
                disableHoverAnimation,
                useLowDetail: false,
                colors: getSectionMarkerColors(section),
              }}
            />
          );
        })}
      {draggedSeat &&
        draggedSeat.id &&
        !selectedSeatIdSet.has(draggedSeat.id) &&
        (() => {
          const pos = dragPosition ?? { x: draggedSeat.x, y: draggedSeat.y };
          const { x, y } = percentageToStage(pos.x, pos.y);
          const colors = getSeatMarkerColors(draggedSeat);
          return (
            <MemoizedSeatMarkerCanvas
              key={draggedSeat.id}
              seat={draggedSeat}
              position={{ x, y }}
              selection={{ isSelected: false }}
              interaction={{
                isPlacingSeats: handlers.isPlacingSeats,
                isPanning: handlers.isPanning,
                isSpacePressed: handlers.isSpacePressed,
                isPlacingSections: handlers.isPlacingSections,
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
                imageWidth: displayedWidth,
                imageHeight: displayedHeight,
              }}
              display={{
                readOnly,
                disableHoverAnimation,
                useLowDetail: false,
                colors,
                forceDraggable: true,
              }}
            />
          );
        })()}
      {designMode === "section-level" &&
        draggedSection &&
        draggedSection.id &&
        !selectedSectionIdSetForSections.has(draggedSection.id) &&
        (() => {
          const pos = dragPosition ?? {
            x: draggedSection.x,
            y: draggedSection.y,
          };
          const { x, y } = percentageToStage(pos.x, pos.y);
          return (
            <MemoizedSectionMarkerCanvas
              key={draggedSection.id}
              section={draggedSection}
              position={{ x, y }}
              selection={{ isSelected: false }}
              interaction={{
                isPlacingSections: handlers.isPlacingSections,
                isPanning: handlers.isPanning,
                isSpacePressed: handlers.isSpacePressed,
                isPlacingSeats: handlers.isPlacingSeats,
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
                useLowDetail: false,
                colors: getSectionMarkerColors(draggedSection),
                forceDraggable: true,
              }}
            />
          );
        })()}
    </Layer>
  );
}
