/**
 * Event Inventory Viewer – Konva Stage/Layer with background image and section/seat markers
 */

import type { RefObject } from "react";
import { Stage, Layer, Image } from "react-konva";
import type Konva from "konva";
import { toast } from "@truths/ui";
import type { Layout } from "../../layouts/types";
import type { Section } from "../../layouts/types";
import type { Seat } from "../../seats/types";
import type { EventSeat } from "../types";
import { SeatMarker } from "./event-inventory-seat-marker";
import { SectionMarker } from "./event-inventory-section-marker";

export interface SectionStats {
  section: Section;
  totalSeats: number;
  eventSeats: EventSeat[];
  statusCounts: Record<string, number>;
  eventSeatCount: number;
}

export interface EventInventoryStageProps {
  containerRef: RefObject<HTMLDivElement>;
  stageRef: RefObject<Konva.Stage>;
  validWidth: number;
  validHeight: number;
  centerX: number;
  centerY: number;
  imageX: number;
  imageY: number;
  displayedWidth: number;
  displayedHeight: number;
  image: HTMLImageElement | null;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  isSpacePressed: boolean;
  isPanning: boolean;
  hoveredSeatId: string | null;
  layout: Layout;
  selectedSectionId: string | null;
  sections: Section[];
  sectionStats: Map<string, SectionStats>;
  displayedSeats: Seat[];
  seatStatusMap: Map<string, EventSeat>;
  locationStatusMap: Map<string, EventSeat>;
  sectionNameMap: Map<string, string>;
  selectedSeatIds: Set<string>;
  hoveredSectionId: string | null;
  percentageToStage: (
    xPercent: number,
    yPercent: number
  ) => { x: number; y: number };
  onWheel: (
    e: Konva.KonvaEventObject<WheelEvent>,
    isSpacePressed: boolean
  ) => void;
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  setHoveredSectionId: (id: string | null) => void;
  setHoveredSectionData: (
    data: {
      section: Section;
      seatCount: number;
      eventSeatCount: number;
      statusSummary: Record<string, number>;
    } | null
  ) => void;
  setHoveredSeatPosition: (pos: { x: number; y: number } | null) => void;
  setHoveredSeatId: (id: string | null) => void;
  setHoveredSeatData: (
    data: { seat: Seat; eventSeat?: EventSeat } | null
  ) => void;
  updatePopoverPosition: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  setSelectedSectionId: (id: string | null) => void;
  setZoomLevel: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  onSeatClick?: (seatId: string, eventSeat?: EventSeat) => void;
}

export function EventInventoryStage({
  containerRef,
  stageRef,
  validWidth,
  validHeight,
  centerX,
  centerY,
  imageX,
  imageY,
  displayedWidth,
  displayedHeight,
  image,
  zoomLevel,
  panOffset,
  isSpacePressed,
  isPanning,
  hoveredSeatId,
  layout,
  selectedSectionId,
  sections,
  sectionStats,
  displayedSeats,
  seatStatusMap,
  locationStatusMap,
  sectionNameMap,
  selectedSeatIds,
  hoveredSectionId,
  percentageToStage,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  setHoveredSectionId,
  setHoveredSectionData,
  setHoveredSeatPosition,
  setHoveredSeatId,
  setHoveredSeatData,
  updatePopoverPosition,
  setSelectedSectionId,
  setZoomLevel,
  setPanOffset,
  onSeatClick,
}: EventInventoryStageProps) {
  function renderSectionMarkers() {
    return sections.map((section) => {
      const stats = sectionStats.get(section.id);
      if (!stats) return null;
      if (!section.x_coordinate || !section.y_coordinate) return null;

      const { x, y } = percentageToStage(
        section.x_coordinate,
        section.y_coordinate
      );

      return (
        <SectionMarker
          key={section.id}
          section={section}
          x={x}
          y={y}
          isHovered={hoveredSectionId === section.id}
          isSpacePressed={isSpacePressed}
          totalSeats={stats.totalSeats}
          eventSeatCount={stats.eventSeatCount}
          statusCounts={stats.statusCounts}
          imageWidth={displayedWidth}
          imageHeight={displayedHeight}
          onMouseEnter={(e) => {
            setHoveredSectionId(section.id);
            setHoveredSectionData({
              section,
              seatCount: stats.totalSeats,
              eventSeatCount: stats.eventSeats.length,
              statusSummary: stats.statusCounts,
            });
            updatePopoverPosition(e);
          }}
          onMouseMove={updatePopoverPosition}
          onMouseLeave={() => {
            setHoveredSectionId(null);
            setHoveredSeatPosition(null);
            setHoveredSectionData(null);
          }}
          onClick={() => {
            if (stats.totalSeats === 0) {
              toast({
                title: "No Seats Available",
                description: `Section "${section.name}" does not have any seats. Please add seats to this section first.`,
                variant: "destructive",
              });
              return;
            }
            setSelectedSectionId(section.id);
            setZoomLevel(1);
            setPanOffset({ x: 0, y: 0 });
          }}
        />
      );
    });
  }

  function getEventSeatFor(seat: Seat): EventSeat | undefined {
    if (seat.id && seatStatusMap.has(seat.id)) {
      return seatStatusMap.get(seat.id);
    }
    if (seat.row && seat.seat_number) {
      const sectionName =
        seat.section_name || sectionNameMap.get(seat.section_id);
      if (sectionName) {
        const key = `${sectionName}|${seat.row}|${seat.seat_number}`;
        return locationStatusMap.get(key);
      }
    }
    return undefined;
  }

  function renderSeatMarkers() {
    return displayedSeats.map((seat) => {
      if (!seat.x_coordinate || !seat.y_coordinate) return null;

      const { x, y } = percentageToStage(seat.x_coordinate, seat.y_coordinate);
      const eventSeat = getEventSeatFor(seat);
      const isSelected = Boolean(seat.id && selectedSeatIds.has(seat.id));

      return (
        <SeatMarker
          key={seat.id}
          seat={seat}
          eventSeat={eventSeat}
          x={x}
          y={y}
          isHovered={hoveredSeatId === seat.id}
          isSpacePressed={isSpacePressed}
          isSelected={isSelected}
          imageWidth={displayedWidth}
          imageHeight={displayedHeight}
          onMouseEnter={(e) => {
            setHoveredSeatId(seat.id);
            setHoveredSeatData({ seat, eventSeat });
            updatePopoverPosition(e);
          }}
          onMouseMove={updatePopoverPosition}
          onMouseLeave={() => {
            setHoveredSeatId(null);
            setHoveredSeatPosition(null);
            setHoveredSeatData(null);
          }}
          onClick={() => {
            if (eventSeat?.status === "available") {
              if (onSeatClick) {
                onSeatClick(seat.id, eventSeat);
              } else {
                console.log("Seat clicked:", seat, eventSeat);
              }
            }
          }}
        />
      );
    });
  }

  const showSections =
    layout.design_mode === "section-level" && !selectedSectionId;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ minHeight: "600px", height: "70vh" }}
    >
      <Stage
        ref={stageRef}
        width={validWidth}
        height={validHeight}
        onWheel={(e) => onWheel(e, isSpacePressed)}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        style={{
          display: "block",
          cursor: hoveredSeatId
            ? "pointer"
            : isPanning || isSpacePressed
              ? "grabbing"
              : "default",
        }}
      >
        <Layer
          x={centerX + panOffset.x}
          y={centerY + panOffset.y}
          scaleX={zoomLevel}
          scaleY={zoomLevel}
          offsetX={centerX}
          offsetY={centerY}
        >
          {image && (
            <Image
              name="background-image"
              image={image}
              x={imageX}
              y={imageY}
              width={displayedWidth}
              height={displayedHeight}
              listening={true}
            />
          )}

          {showSections ? renderSectionMarkers() : renderSeatMarkers()}
        </Layer>
      </Stage>
    </div>
  );
}
