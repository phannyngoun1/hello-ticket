/**
 * Types for seat designer view callbacks.
 * Extracted from use-seat-designer-view-callbacks for readability.
 */

import type Konva from "konva";
import type { PlacementShape, PlacementShapeType, SeatMarker, SectionMarker } from "../types";

export interface UseSeatLevelCallbacksProps {
  recordSnapshot: () => void;
  setSeats: React.Dispatch<React.SetStateAction<SeatMarker[]>>;
  setSectionMarkers: React.Dispatch<React.SetStateAction<SectionMarker[]>>;
  setEditingSectionId: (id: string | null) => void;
  setIsSectionCreationPending: (pending: boolean) => void;
  setPlacementShape: React.Dispatch<React.SetStateAction<PlacementShape>>;
  setSelectedShapeTool: (tool: PlacementShapeType | null) => void;
  setSelectedOverlayId: (id: string | null) => void;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  setSelectedSeatIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setSelectedSectionIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  seats: SeatMarker[];
  sectionMarkers: SectionMarker[];
  selectedSeatIds: string[];
  selectedSectionIds: string[];
  selectedShapeTool: PlacementShapeType | null;
  handleSeatClickWithToolSwitch: (
    seat: SeatMarker,
    event?: { shiftKey?: boolean },
  ) => void;
  handleKonvaSeatDragEnd: (seatId: string, x: number, y: number) => void;
  handleBatchSeatDragEnd: (
    updates: Array<{ id: string; x: number; y: number }>,
  ) => void;
  handleSeatShapeTransform: (
    seatId: string,
    shape: PlacementShape,
    position?: { x: number; y: number },
  ) => void;
  handleKonvaImageClick: (
    e: Konva.KonvaEventObject<MouseEvent>,
    coords?: { x: number; y: number },
  ) => void;
  handleDeselect?: () => void;
  handleShapeDraw: (
    shape: PlacementShape,
    x: number,
    y: number,
    width?: number,
    height?: number,
  ) => void;
  handleResetZoomAndPan: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handlePanDelta: (delta: { x: number; y: number }) => void;
}

export interface UseSectionLevelCallbacksProps {
  recordSnapshot: () => void;
  setSectionMarkers: React.Dispatch<React.SetStateAction<SectionMarker[]>>;
  setSelectedShapeTool: (tool: PlacementShapeType | null) => void;
  setSelectedOverlayId: (id: string | null) => void;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  setSelectedSectionIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  sectionMarkers: SectionMarker[];
  selectedSectionIds: string[];
  selectedShapeTool: PlacementShapeType | null;
  handleSeatClickWithToolSwitch?: (
    seat: SeatMarker,
    event?: { shiftKey?: boolean },
  ) => void;
  handleSectionClickWithToolSwitch: (
    section: SectionMarker,
    event?: { shiftKey?: boolean },
  ) => void;
  handleKonvaSectionDragEnd: (
    sectionId: string,
    newX: number,
    newY: number,
  ) => void;
  handleKonvaSeatDragEnd: (seatId: string, x: number, y: number) => void;
  handleBatchSeatDragEnd: (
    updates: Array<{ id: string; x: number; y: number }>,
  ) => void;
  handleBatchSectionDragEnd: (
    updates: Array<{ id: string; x: number; y: number }>,
  ) => void;
  handleSeatShapeTransform: (
    seatId: string,
    shape: PlacementShape,
    position?: { x: number; y: number },
  ) => void;
  handleSectionShapeTransform: (
    sectionId: string,
    shape: PlacementShape,
    position?: { x: number; y: number },
  ) => void;
  handleKonvaImageClick: (
    e: Konva.KonvaEventObject<MouseEvent>,
    coords?: { x: number; y: number },
  ) => void;
  handleDeselect?: () => void;
  handleShapeDraw: (
    shape: PlacementShape,
    x: number,
    y: number,
    width?: number,
    height?: number,
  ) => void;
  handleResetZoomAndPan: () => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handlePanDelta: (delta: { x: number; y: number }) => void;
}
