/**
 * Shared types for floor plan layer components
 */

import type Konva from "konva";
import type {
  PlacementShape,
  PlacementShapeType,
  SeatMarker,
  SectionMarker,
} from "../types";

export interface LayerTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

export interface ShapeOverlay {
  id: string;
  x: number;
  y: number;
  shape: PlacementShape;
  onClick?: () => void;
  onHover?: () => void;
  label?: string;
  isSelected?: boolean;
  isPlacement?: boolean;
}

export interface BackgroundLayerProps {
  layerRef: React.RefObject<Konva.Layer | null>;
  layerTransform: LayerTransform;
  showGrid: boolean;
  gridSize: number;
  validWidth: number;
  validHeight: number;
  imageX: number;
  imageY: number;
  displayedWidth: number;
  displayedHeight: number;
  canvasBackgroundColor: string;
  image: HTMLImageElement | null;
  onBackgroundMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onBackgroundClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onBackgroundDblClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onBackgroundTap: (e: Konva.KonvaEventObject<TouchEvent>) => void;
}

export interface MarkersLayerHandlers {
  isPlacingSeats: boolean;
  isPlacingSections: boolean;
  isPanning: boolean;
  isSpacePressed: boolean;
  onSeatClick?: (seat: SeatMarker, event?: { shiftKey?: boolean }) => void;
  onSectionClick?: (
    section: SectionMarker,
    event?: { shiftKey?: boolean },
  ) => void;
  onSectionDoubleClick?: (section: SectionMarker) => void;
  onSeatDragEnd: (
    seatId: string,
    e: Konva.KonvaEventObject<globalThis.DragEvent>,
  ) => void;
  onSeatDragStart?: (seatId: string) => void;
  onSeatDragMove?: (
    seatId: string,
    stageX: number,
    stageY: number,
  ) => void;
  onSectionDragEnd?: (
    sectionId: string,
    layerX: number,
    layerY: number,
  ) => void;
  onSectionDragMove?: (
    sectionId: string,
    stageX: number,
    stageY: number,
  ) => void;
  onSectionDragStart?: (sectionId: string) => void;
  onSeatShapeTransform?: (
    seatId: string,
    shape: PlacementShape,
    position?: { x: number; y: number },
  ) => void;
  onSectionShapeTransform?: (
    sectionId: string,
    shape: PlacementShape,
    position?: { x: number; y: number },
  ) => void;
  onShapeOverlayClick?: (overlayId: string) => void;
}

export interface StaticMarkersLayerProps {
  layer: { layerTransform: LayerTransform };
  data: {
    staticSeats: SeatMarker[];
    staticSections: SectionMarker[];
    visibleShapeOverlays: ShapeOverlay[];
    designMode: "seat-level" | "section-level";
  };
  selection: {
    selectedSeatIdSet: Set<string>;
    selectedSectionIdSet: Set<string>;
    selectedOverlayId: string | null | undefined;
  };
  canvas: {
    percentageToStage: (x: number, y: number) => { x: number; y: number };
    layerToPercentage?: (layerX: number, layerY: number) => { x: number; y: number };
    displayedWidth: number;
    displayedHeight: number;
  };
  display: {
    useLowDetail: boolean;
    disableHoverAnimation: boolean;
    readOnly: boolean;
    selectedShapeTool?: PlacementShapeType | null;
  };
  drag: {
    draggedSeatId: string | null;
    draggedSectionId: string | null;
    dragPosition: { x: number; y: number } | null;
  };
  handlers: MarkersLayerHandlers;
  colors: {
    getSeatMarkerColors: (seat: SeatMarker) => { fill: string; stroke: string };
    getSectionMarkerColors: (
      section: SectionMarker,
    ) => { fill: string; stroke: string };
  };
}

export interface InteractiveMarkersLayerProps {
  layerTransform: LayerTransform;
  selectedSeats: SeatMarker[];
  selectedSections: SectionMarker[];
  draggedSeat: SeatMarker | undefined;
  draggedSection: SectionMarker | undefined;
  designMode: "seat-level" | "section-level";
  percentageToStage: (x: number, y: number) => { x: number; y: number };
  layerToPercentage?: (layerX: number, layerY: number) => { x: number; y: number };
  displayedWidth: number;
  displayedHeight: number;
  disableHoverAnimation: boolean;
  readOnly: boolean;
  selectedShapeTool?: PlacementShapeType | null;
  dragPosition: { x: number; y: number } | null;
  handlers: MarkersLayerHandlers & { onTransformProgress?: () => void };
  getSeatMarkerColors: (seat: SeatMarker) => { fill: string; stroke: string };
  getSectionMarkerColors: (
    section: SectionMarker,
  ) => { fill: string; stroke: string };
}

export interface OverlayLayerProps {
  layerTransform: LayerTransform;
  imageX: number;
  imageY: number;
  displayedWidth: number;
  displayedHeight: number;
  selectedShapeTool?: PlacementShapeType | null;
  freeformPath: Array<{ x: number; y: number }>;
  freeformHoverPos: { x: number; y: number } | null;
  isDrawingShape: boolean;
  drawStartPos: { x: number; y: number } | null;
  drawCurrentPos: { x: number; y: number } | null;
  percentageToStage: (x: number, y: number) => { x: number; y: number };
  previewShapeRef: React.RefObject<Konva.Group>;
  onOverlayLayerClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

export interface SelectionMarqueeLayerProps {
  selectionStart: { x: number; y: number };
  selectionCurrent: { x: number; y: number };
  stroke?: string;
  fill?: string;
}
