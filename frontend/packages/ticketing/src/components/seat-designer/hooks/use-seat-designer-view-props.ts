/**
 * Hooks that build full props for SeatLevelView and SectionLevelView.
 * Encapsulates prop construction so seat-designer.tsx stays clean.
 */

import { useMemo } from "react";
import type { SeatLevelViewProps } from "../seat-level-view";
import type { SectionLevelViewProps } from "../section-level-view";
import {
  useSeatLevelCallbacks,
  useSectionLevelCallbacks,
} from "./use-seat-designer-view-callbacks";
import Konva from "konva";
import { PlacementShape, PlacementShapeType, SectionMarker, SeatMarker } from "../types";
import { SeatFormData } from "../form-schemas";
import { UseFormReturn } from "react-hook-form";

/** All state/setters needed to build SeatLevelView props */
export interface SeatLevelViewParams {
  containerRef: React.RefObject<HTMLDivElement>;
  dimensionsReady: boolean;
  containerDimensions: { width: number; height: number };
  isFullscreen: boolean;
  mainImageUrl?: string;
  canvasBackgroundColor: string;
  displayedSeats: SeatMarker[];
  seats: SeatMarker[];
  sectionMarkers: SectionMarker[];
  effectiveSectionsData?: Array<{ id: string; name: string }>;
  designMode: "seat-level" | "section-level";
  selectedSeat: SeatMarker | null;
  selectedSeatIds: string[];
  selectedSectionIds: string[];
  selectedSectionMarker: SectionMarker | null;
  anchorSeatId: string | null;
  anchorSectionId: string | null;
  seatPlacementForm: UseFormReturn<
    SeatFormData
  >;
  sectionSelectValue: string;
  setSectionSelectValue: (value: string) => void;
  setSelectedShapeTool: (
    tool: PlacementShapeType | null,
  ) => void;
  setViewingSeat: (seat: SeatMarker | null) => void;
  setViewingSection: (section: SectionMarker | null) => void;
  setSelectedSectionMarker: (
    section: SectionMarker | null,
  ) => void;
  setIsEditingSeat: (editing: boolean) => void;
  setIsSectionFormOpen: (open: boolean) => void;
  setEditingSectionId: (id: string | null) => void;
  setSelectedSeatIds: (
    ids: string[] | ((prev: string[]) => string[]),
  ) => void;
  setSelectedSectionIds: (
    ids: string[] | ((prev: string[]) => string[]),
  ) => void;
  setSelectedOverlayId: (id: string | null) => void;
  seatEditForm: UseFormReturn<
    SeatFormData
  >;
  isEditingSeat: boolean;
  recordSnapshot: () => void;
  removeSeat: (id: string) => void;
  removeSection: (id: string) => void;
  updateSeat: (
    id: string,
    updates: Partial<SeatMarker>,
  ) => void;
  sectionForm: { reset: (data?: { name?: string }) => void };
  setIsManageSectionsOpen: (open: boolean) => void;
  selectedShapeTool: PlacementShapeType | null;
  displayedShapeOverlays: Array<{
    id: string;
    x: number;
    y: number;
    shape: PlacementShape;
    onClick?: () => void;
    onHover?: () => void;
    label?: string;
    isSelected?: boolean;
    isPlacement?: boolean;
  }>;
  selectedOverlayId: string | null;
  showGrid: boolean;
  gridSize: number;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  isPlacingSeats: boolean;
  readOnly: boolean;
  setSeats: React.Dispatch<
    React.SetStateAction<SeatMarker[]>
  >;
  setSectionMarkers: React.Dispatch<
    React.SetStateAction<SectionMarker[]>
  >;
  setIsSectionCreationPending: (pending: boolean) => void;
  setPlacementShape: React.Dispatch<
    React.SetStateAction<PlacementShape>
  >;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
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

export function useSeatLevelViewProps(
  params: SeatLevelViewParams,
): SeatLevelViewProps {
  const callbacks = useSeatLevelCallbacks({
    recordSnapshot: params.recordSnapshot,
    setSeats: params.setSeats,
    setSectionMarkers: params.setSectionMarkers,
    setEditingSectionId: params.setEditingSectionId,
    setIsSectionCreationPending: params.setIsSectionCreationPending,
    setPlacementShape: params.setPlacementShape,
    setSelectedShapeTool: params.setSelectedShapeTool,
    setSelectedOverlayId: params.setSelectedOverlayId,
    setZoomLevel: params.setZoomLevel,
    setSelectedSeatIds: params.setSelectedSeatIds,
    setSelectedSectionIds: params.setSelectedSectionIds,
    seats: params.seats,
    sectionMarkers: params.sectionMarkers,
    selectedSeatIds: params.selectedSeatIds,
    selectedSectionIds: params.selectedSectionIds,
    selectedShapeTool: params.selectedShapeTool,
    handleSeatClickWithToolSwitch: params.handleSeatClickWithToolSwitch,
    handleKonvaSeatDragEnd: params.handleKonvaSeatDragEnd,
    handleBatchSeatDragEnd: params.handleBatchSeatDragEnd,
    handleSeatShapeTransform: params.handleSeatShapeTransform,
    handleKonvaImageClick: params.handleKonvaImageClick,
    handleDeselect: params.handleDeselect,
    handleShapeDraw: params.handleShapeDraw,
    handleResetZoomAndPan: params.handleResetZoomAndPan,
    handleZoomIn: params.handleZoomIn,
    handleZoomOut: params.handleZoomOut,
    handlePanDelta: params.handlePanDelta,
  });

  return useMemo(
    () => ({
      canvas: {
        containerRef: params.containerRef,
        dimensionsReady: params.dimensionsReady,
        containerDimensions: params.containerDimensions,
        isFullscreen: params.isFullscreen,
        mainImageUrl: params.mainImageUrl,
        canvasBackgroundColor: params.canvasBackgroundColor,
      },
      data: {
        displayedSeats: params.displayedSeats,
        seats: params.seats,
        sectionMarkers: params.sectionMarkers,
        effectiveSectionsData: params.effectiveSectionsData,
        designMode: params.designMode,
      },
      selection: {
        selectedSeat: params.selectedSeat,
        selectedSeatIds: params.selectedSeatIds,
        selectedSectionIds: params.selectedSectionIds,
        selectedSectionMarker: params.selectedSectionMarker,
        anchorSeatId: params.anchorSeatId,
        anchorSectionId: params.anchorSectionId,
      },
      forms: {
        seatPlacementForm: params.seatPlacementForm,
        sectionSelectValue: params.sectionSelectValue,
        setSectionSelectValue: params.setSectionSelectValue,
        seatEditForm: params.seatEditForm,
        isEditingSeat: params.isEditingSeat,
        sectionForm: params.sectionForm,
        setSelectedShapeTool: params.setSelectedShapeTool,
        setViewingSeat: params.setViewingSeat,
        setViewingSection: params.setViewingSection,
        setSelectedSectionMarker: params.setSelectedSectionMarker,
        setIsEditingSeat: params.setIsEditingSeat,
        setIsSectionFormOpen: params.setIsSectionFormOpen,
        setEditingSectionId: params.setEditingSectionId,
        setSelectedSeatIds: params.setSelectedSeatIds,
        setSelectedSectionIds: params.setSelectedSectionIds,
        setSelectedOverlayId: params.setSelectedOverlayId,
        setIsManageSectionsOpen: params.setIsManageSectionsOpen,
      },
      actions: {
        recordSnapshot: params.recordSnapshot,
        removeSeat: params.removeSeat,
        removeSection: params.removeSection,
        updateSeat: params.updateSeat,
      },
      callbacks,
      toolbar: {
        selectedShapeTool: params.selectedShapeTool,
        displayedShapeOverlays: params.displayedShapeOverlays,
        selectedOverlayId: params.selectedOverlayId,
        showGrid: params.showGrid,
        gridSize: params.gridSize,
        zoomLevel: params.zoomLevel,
        panOffset: params.panOffset,
        isPlacingSeats: params.isPlacingSeats,
        readOnly: params.readOnly,
      },
    }),
    [callbacks, params],
  );
}

/** All state/setters needed to build SectionLevelView props */
export interface SectionLevelViewParams {
  containerRef: React.RefObject<HTMLDivElement>;
  dimensionsReady: boolean;
  containerDimensions: { width: number; height: number };
  isFullscreen: boolean;
  mainImageUrl?: string;
  canvasBackgroundColor: string;
  sectionMarkers: SectionMarker[];
  designMode: "section-level";
  selectedSectionMarker: SectionMarker | null;
  selectedSectionIds: string[];
  anchorSeatId: string | null;
  anchorSectionId: string | null;
  isSectionCreationPending: boolean;
  setIsSectionCreationPending: (pending: boolean) => void;
  editingSectionId: string | null;
  setEditingSectionId: (id: string | null) => void;
  placementShape: PlacementShape | null;
  setPlacementShape: React.Dispatch<
    React.SetStateAction<PlacementShape>
  >;
  pendingSectionCoordinates: { x: number; y: number } | null;
  setPendingSectionCoordinates: (
    coords: { x: number; y: number } | null,
  ) => void;
  setSelectedShapeTool: (
    tool: PlacementShapeType | null,
  ) => void;
  setViewingSection: (section: SectionMarker | null) => void;
  setSelectedSectionMarker: (
    section: SectionMarker | null,
  ) => void;
  setSelectedSectionIds: (
    ids: string[] | ((prev: string[]) => string[]),
  ) => void;
  setSelectedOverlayId: (id: string | null) => void;
  seatPlacementForm: UseFormReturn<
    SeatFormData
  >;
  recordSnapshot: () => void;
  addSection: (section: {
    name: string;
    x?: number;
    y?: number;
    shape?: PlacementShape;
  }) => void;
  updateSection: (
    id: string,
    updates: Partial<SectionMarker>,
  ) => void;
  removeSection: (id: string) => void;
  selectedShapeTool: PlacementShapeType | null;
  displayedShapeOverlays: Array<{
    id: string;
    x: number;
    y: number;
    shape: PlacementShape;
    onClick?: () => void;
    onHover?: () => void;
    label?: string;
    isSelected?: boolean;
    isPlacement?: boolean;
  }>;
  selectedOverlayId: string | null;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  isPlacingSections: boolean;
  readOnly: boolean;
  setSectionMarkers: React.Dispatch<
    React.SetStateAction<SectionMarker[]>
  >;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
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

export function useSectionLevelViewProps(
  params: SectionLevelViewParams,
): SectionLevelViewProps {
  const callbacks = useSectionLevelCallbacks({
    recordSnapshot: params.recordSnapshot,
    setSectionMarkers: params.setSectionMarkers,
    setSelectedShapeTool: params.setSelectedShapeTool,
    setSelectedOverlayId: params.setSelectedOverlayId,
    setZoomLevel: params.setZoomLevel,
    setSelectedSectionIds: params.setSelectedSectionIds,
    sectionMarkers: params.sectionMarkers,
    selectedSectionIds: params.selectedSectionIds,
    selectedShapeTool: params.selectedShapeTool,
    handleSeatClickWithToolSwitch: params.handleSeatClickWithToolSwitch,
    handleSectionClickWithToolSwitch: params.handleSectionClickWithToolSwitch,
    handleKonvaSectionDragEnd: params.handleKonvaSectionDragEnd,
    handleKonvaSeatDragEnd: params.handleKonvaSeatDragEnd,
    handleBatchSeatDragEnd: params.handleBatchSeatDragEnd,
    handleBatchSectionDragEnd: params.handleBatchSectionDragEnd,
    handleSeatShapeTransform: params.handleSeatShapeTransform,
    handleSectionShapeTransform: params.handleSectionShapeTransform,
    handleKonvaImageClick: params.handleKonvaImageClick,
    handleDeselect: params.handleDeselect,
    handleShapeDraw: params.handleShapeDraw,
    handleResetZoomAndPan: params.handleResetZoomAndPan,
    handleZoomIn: params.handleZoomIn,
    handleZoomOut: params.handleZoomOut,
    handlePanDelta: params.handlePanDelta,
  });

  return {
    canvas: {
      containerRef: params.containerRef,
      dimensionsReady: params.dimensionsReady,
      containerDimensions: params.containerDimensions,
      isFullscreen: params.isFullscreen,
      mainImageUrl: params.mainImageUrl,
      canvasBackgroundColor: params.canvasBackgroundColor,
    },
    data: {
      sectionMarkers: params.sectionMarkers,
      designMode: params.designMode,
    },
    selection: {
      selectedSectionMarker: params.selectedSectionMarker,
      selectedSectionIds: params.selectedSectionIds,
      anchorSeatId: params.anchorSeatId,
      anchorSectionId: params.anchorSectionId,
    },
    sectionCreation: {
      isSectionCreationPending: params.isSectionCreationPending,
      setIsSectionCreationPending: params.setIsSectionCreationPending,
      editingSectionId: params.editingSectionId,
      setEditingSectionId: params.setEditingSectionId,
      placementShape: params.placementShape,
      setPlacementShape: params.setPlacementShape,
      pendingSectionCoordinates: params.pendingSectionCoordinates,
      setPendingSectionCoordinates: params.setPendingSectionCoordinates,
      setSelectedShapeTool: params.setSelectedShapeTool,
      setViewingSection: params.setViewingSection,
      setSelectedSectionMarker: params.setSelectedSectionMarker,
      setSelectedSectionIds: params.setSelectedSectionIds,
      setSelectedOverlayId: params.setSelectedOverlayId,
      seatPlacementForm: params.seatPlacementForm,
    },
    actions: {
      recordSnapshot: params.recordSnapshot,
      addSection: params.addSection,
      updateSection: params.updateSection,
      removeSection: params.removeSection,
    },
    callbacks,
    toolbar: {
      selectedShapeTool: params.selectedShapeTool,
      displayedShapeOverlays: params.displayedShapeOverlays,
      selectedOverlayId: params.selectedOverlayId,
      zoomLevel: params.zoomLevel,
      panOffset: params.panOffset,
      isPlacingSections: params.isPlacingSections,
      readOnly: params.readOnly,
    },
  };
}
