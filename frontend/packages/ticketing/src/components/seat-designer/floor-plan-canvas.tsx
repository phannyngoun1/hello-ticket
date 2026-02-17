/**
 * Konva-based Canvas Component for Seat Designer
 *
 * Provides better performance and smoother interactions compared to DOM-based rendering
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Stage } from "react-konva";
import Konva from "konva";
import {
  PlacementShapeType,
  type PlacementShape,
  type SeatMarker,
  type SectionMarker,
} from "./types";
import {
  getSeatMarkerColors,
  getSectionMarkerColors,
} from "./colors";
import {
  BackgroundLayer,
  StaticMarkersLayer,
  InteractiveMarkersLayer,
  OverlayLayer,
  SelectionMarqueeLayer,
} from "./floor-plan-layers";
import {
  useLetterboxing,
  NO_IMAGE_ASPECT_RATIO,
} from "./hooks/use-letterboxing";

export interface FloorPlanCanvasProps {
  data: {
    /** When undefined/empty, renders blank canvas (simple floor mode) */
    imageUrl?: string;
    seats: SeatMarker[];
    sections?: SectionMarker[];
  };
  selection: {
    selectedSeatId?: string | null;
    selectedSectionId?: string | null;
    /** Multi-selection: all selected seat ids (used for highlight + Delete). */
    selectedSeatIds?: string[];
    /** Multi-selection: all selected section ids (used for highlight + Delete). */
    selectedSectionIds?: string[];
  };
  placement: {
    isPlacingSeats: boolean;
    isPlacingSections: boolean;
    readOnly?: boolean;
  };
  view: {
    zoomLevel: number;
    panOffset: { x: number; y: number };
    containerWidth: number;
    containerHeight: number;
    /** Background color when no image (simple floor mode). Default #e5e7eb */
    canvasBackgroundColor?: string;
    /** Show grid lines on canvas */
    showGrid?: boolean;
    /** Grid size in percentage */
    gridSize?: number;
  };
  design: {
    designMode: "seat-level" | "section-level";
    selectedShapeTool?: PlacementShapeType | null;
    shapeOverlays?: Array<{
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
    selectedOverlayId?: string | null;
  };
  handlers: {
    /** Called when user finishes a drag-to-select marquee with markers inside the rect. */
    onMarkersInRect?: (seatIds: string[], sectionIds: string[]) => void;
    onSeatClick?: (seat: SeatMarker, event?: { shiftKey?: boolean }) => void;
    onSectionClick?: (
      section: SectionMarker,
      event?: { shiftKey?: boolean },
    ) => void;
    onSectionDoubleClick?: (section: SectionMarker) => void;
    onSectionDragEnd?: (sectionId: string, newX: number, newY: number) => void;
    onSeatDragEnd: (seatId: string, newX: number, newY: number) => void;
    onBatchSeatDragEnd?: (
      updates: Array<{ id: string; x: number; y: number }>,
    ) => void;
    onBatchSectionDragEnd?: (
      updates: Array<{ id: string; x: number; y: number }>,
    ) => void;
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
    onImageClick?: (
      e: Konva.KonvaEventObject<MouseEvent>,
      percentageCoords?: { x: number; y: number },
    ) => void;
    onDeselect?: () => void;
    onShapeDraw?: (
      shape: PlacementShape,
      x: number,
      y: number,
      width?: number,
      height?: number,
    ) => void;
    onShapeOverlayClick?: (overlayId: string) => void;
    onWheel?: (
      e: Konva.KonvaEventObject<WheelEvent>,
      isSpacePressed: boolean,
    ) => void;
    onPanStart?: () => void;
    onPan?: (delta: { x: number; y: number }) => void;
    onPanEnd?: () => void;
  };
}

// Threshold: only virtualize when we have more than this many objects
const VIRTUALIZATION_THRESHOLD = 40;

// Threshold: disable hover animations when total count exceeds this
const HOVER_ANIMATION_THRESHOLD = 100;

/** Returns true if target is a marker (seat/section) or transformer (or related). */
function isTargetMarkerOrTransformer(target: Konva.Node): boolean {
  const targetType = target.getType();
  if (targetType === "Transformer") return true;
  let current: Konva.Node | null = target;
  while (current) {
    if (current.getType() === "Transformer") return true;
    if (current.name() === "seat-marker" || current.name() === "section-marker")
      return true;
    if (
      current.getParent()?.name() === "seat-marker" ||
      current.getParent()?.name() === "section-marker"
    )
      return true;
    current = current.getParent();
  }
  return false;
}

export function FloorPlanCanvas({
  data,
  selection,
  placement,
  view,
  design,
  handlers,
}: FloorPlanCanvasProps) {
  const { imageUrl, seats, sections = [] } = data;
  const {
    selectedSeatId,
    selectedSectionId,
    selectedSeatIds: selectedSeatIdsProp,
    selectedSectionIds: selectedSectionIdsProp,
  } = selection;
  const { isPlacingSeats, isPlacingSections, readOnly = false } = placement;
  const {
    zoomLevel,
    panOffset,
    containerWidth,
    containerHeight,
    canvasBackgroundColor = "#e5e7eb",
    showGrid = false,
    gridSize = 5,
  } = view;
  const {
    designMode,
    selectedShapeTool,
    shapeOverlays = [],
    selectedOverlayId,
  } = design;
  const {
    onMarkersInRect,
    onSeatClick,
    onSectionClick,
    onSectionDoubleClick,
    onSectionDragEnd,
    onSeatDragEnd,
    onBatchSeatDragEnd,
    onBatchSectionDragEnd,
    onSeatShapeTransform,
    onSectionShapeTransform,
    onImageClick,
    onDeselect,
    onShapeDraw,
    onShapeOverlayClick,
    onWheel,
    onPanStart,
    onPan,
    onPanEnd,
  } = handlers;
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [drawStartPos, setDrawStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [drawCurrentPos, setDrawCurrentPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [freeformPath, setFreeformPath] = useState<
    Array<{ x: number; y: number }>
  >([]);
  const [freeformHoverPos, setFreeformHoverPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const previewShapeRef = useRef<Konva.Group>(null);
  // Lock canvas size for no-image mode so markers stay fixed on resize
  const noImageInitialSizeRef = useRef<{ w: number; h: number } | null>(null);

  // Drag layer optimization: track which item is being dragged
  const [draggedSeatId, setDraggedSeatId] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  // Live position during drag so the marker follows the cursor (percentage coords)
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  // Batch drag: move all selected items together
  const [batchDragState, setBatchDragState] = useState<{
    type: "seats" | "sections";
    initialPositions: Map<string, { x: number; y: number }>;
    draggedId: string;
  } | null>(null);
  const [batchDragDelta, setBatchDragDelta] = useState<{
    dx: number;
    dy: number;
  } | null>(null);

  // Drag-to-select marquee (stage coordinates)
  const [selectionStart, setSelectionStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Multi-selection sets (derived from props or single selection)
  const selectedSeatIdSet = useMemo((): Set<string> => {
    if (selectedSeatIdsProp && selectedSeatIdsProp.length > 0) {
      return new Set(selectedSeatIdsProp);
    }
    if (selectedSeatId) return new Set([selectedSeatId]);
    return new Set<string>();
  }, [selectedSeatIdsProp, selectedSeatId]);
  const selectedSectionIdSet = useMemo((): Set<string> => {
    if (selectedSectionIdsProp && selectedSectionIdsProp.length > 0) {
      return new Set(selectedSectionIdsProp);
    }
    if (selectedSectionId) return new Set([selectedSectionId]);
    return new Set<string>();
  }, [selectedSectionIdsProp, selectedSectionId]);

  // Ref to prevent click event after drag-to-draw
  const ignoreClickRef = useRef(false);

  /** Complete freeform shape from path; returns true if completed */
  const completeFreeformShape = useCallback(
    (path: Array<{ x: number; y: number }>) => {
      if (path.length < 2 || !onShapeDraw) return false;
      const finalPath = [...path, path[0]];
      const sumX = finalPath.reduce((s, p) => s + p.x, 0);
      const sumY = finalPath.reduce((s, p) => s + p.y, 0);
      const cx = sumX / finalPath.length;
      const cy = sumY / finalPath.length;
      const points = finalPath.flatMap((p) => [p.x - cx, p.y - cy]);
      onShapeDraw({ type: PlacementShapeType.FREEFORM, points }, cx, cy);
      setFreeformPath([]);
      setFreeformHoverPos(null);
      return true;
    },
    [onShapeDraw],
  );

  /** Handle freeform click: close if near start, else add point. Returns true if handled. */
  const handleFreeformClick = useCallback(
    (coords: { x: number; y: number }) => {
      if (selectedShapeTool !== PlacementShapeType.FREEFORM || !onShapeDraw)
        return false;
      if (freeformPath.length >= 2) {
        const first = freeformPath[0];
        const dist = Math.hypot(coords.x - first.x, coords.y - first.y);
        if (dist < 1.5) return completeFreeformShape(freeformPath);
      }
      setFreeformPath((prev) => {
        if (prev.length === 0) return [coords];
        const last = prev[prev.length - 1];
        const dist = Math.hypot(coords.x - last.x, coords.y - last.y);
        return dist >= 0.1 ? [...prev, coords] : prev;
      });
      return true;
    },
    [selectedShapeTool, onShapeDraw, freeformPath, completeFreeformShape],
  );

  const handleStageWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      onWheel?.(e, isSpacePressed);
    },
    [onWheel, isSpacePressed],
  );

  const handleStageTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt) e.evt.preventDefault();
    },
    [],
  );

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      ignoreClickRef.current = false;
      if (e.evt) e.evt.preventDefault();

      const stage = e.target.getStage();
      if (!stage) return;
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      if (isSpacePressed) {
        setIsPanning(true);
        setPanStartPos(pointerPos);
        onPanStart?.();
        return;
      }

      const isClickOnMarkerOrTransformer = isTargetMarkerOrTransformer(
        e.target,
      );

      if (
        !readOnly &&
        onMarkersInRect &&
        !selectedShapeTool &&
        !isDrawingShape &&
        !isClickOnMarkerOrTransformer
      ) {
        setSelectionStart(pointerPos);
        setSelectionCurrent(pointerPos);
        return;
      }

      const hasSelectedMarker =
        selectedSeatIdSet.size > 0 || selectedSectionIdSet.size > 0;
      if (hasSelectedMarker && isClickOnMarkerOrTransformer) {
        setIsDrawingShape(false);
        setDrawStartPos(null);
        setDrawCurrentPos(null);
        return;
      }

      if (
        selectedShapeTool &&
        onShapeDraw &&
        selectedShapeTool !== PlacementShapeType.FREEFORM
      ) {
        const percentageCoords = pointerToPercentage(
          pointerPos.x,
          pointerPos.y,
        );
        setIsDrawingShape(true);
        setDrawStartPos(percentageCoords);
        setDrawCurrentPos(percentageCoords);
      }
    },
    [
      isSpacePressed,
      onPanStart,
      readOnly,
      onMarkersInRect,
      selectedShapeTool,
      onShapeDraw,
      isDrawingShape,
      selectedSeatIdSet.size,
      selectedSectionIdSet.size,
    ],
  );

  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      if (selectionStart) {
        setSelectionCurrent(pointerPos);
        return;
      }

      const hasSelectedMarker =
        selectedSeatIdSet.size > 0 || selectedSectionIdSet.size > 0;
      const isInteractingWithMarker =
        hasSelectedMarker && isTargetMarkerOrTransformer(e.target);

      if (isPanning && isSpacePressed) {
        const delta = {
          x: pointerPos.x - panStartPos.x,
          y: pointerPos.y - panStartPos.y,
        };
        setPanStartPos(pointerPos);
        onPan?.(delta);
      } else if (
        !isInteractingWithMarker &&
        isDrawingShape &&
        drawStartPos &&
        selectedShapeTool &&
        selectedShapeTool !== PlacementShapeType.FREEFORM
      ) {
        setDrawCurrentPos(pointerToPercentage(pointerPos.x, pointerPos.y));
      } else if (
        !isInteractingWithMarker &&
        selectedShapeTool === PlacementShapeType.FREEFORM &&
        freeformPath.length > 0
      ) {
        setFreeformHoverPos(pointerToPercentage(pointerPos.x, pointerPos.y));
      }
    },
    [
      selectionStart,
      selectedSeatIdSet.size,
      selectedSectionIdSet.size,
      isPanning,
      isSpacePressed,
      panStartPos,
      onPan,
      isDrawingShape,
      drawStartPos,
      selectedShapeTool,
      freeformPath.length,
    ],
  );

  const handleStageMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isPanning) {
        setIsPanning(false);
        onPanEnd?.();
        return;
      }

      if (selectionStart && selectionCurrent && onMarkersInRect) {
        const x1 = Math.min(selectionStart.x, selectionCurrent.x);
        const y1 = Math.min(selectionStart.y, selectionCurrent.y);
        const x2 = Math.max(selectionStart.x, selectionCurrent.x);
        const y2 = Math.max(selectionStart.y, selectionCurrent.y);
        const p1 = stageToPercentage(x1, y1);
        const p2 = stageToPercentage(x2, y2);
        const minPx = Math.min(p1.x, p2.x);
        const maxPx = Math.max(p1.x, p2.x);
        const minPy = Math.min(p1.y, p2.y);
        const maxPy = Math.max(p1.y, p2.y);
        const seatIds = seats
          .filter(
            (s) => s.x >= minPx && s.x <= maxPx && s.y >= minPy && s.y <= maxPy,
          )
          .map((s) => s.id);
        const sectionIds = sections
          .filter(
            (s) => s.x >= minPx && s.x <= maxPx && s.y >= minPy && s.y <= maxPy,
          )
          .map((s) => s.id);
        onMarkersInRect(seatIds, sectionIds);
        setSelectionStart(null);
        setSelectionCurrent(null);
        return;
      }

      const isInteractingWithMarker =
        (selectedSeatIdSet.size > 0 || selectedSectionIdSet.size > 0) &&
        isTargetMarkerOrTransformer(e.target);

      if (isInteractingWithMarker) {
        setIsDrawingShape(false);
        setDrawStartPos(null);
        setDrawCurrentPos(null);
        return;
      }

      if (
        isDrawingShape &&
        drawStartPos &&
        selectedShapeTool &&
        onShapeDraw &&
        selectedShapeTool !== PlacementShapeType.FREEFORM &&
        drawCurrentPos
      ) {
        const startX = drawStartPos.x;
        const startY = drawStartPos.y;
        const endX = drawCurrentPos.x;
        const endY = drawCurrentPos.y;
        const distance = Math.sqrt(
          Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2),
        );
        const minDragDistance = 0.3;

        if (distance >= minDragDistance) {
          e.cancelBubble = true;
          ignoreClickRef.current = true;

          const minSize = 1.5;
          const width = Math.max(minSize, Math.abs(endX - startX));
          const height = Math.max(minSize, Math.abs(endY - startY));
          const centerX = (startX + endX) / 2;
          const centerY = (startY + endY) / 2;

          let shape: PlacementShape;
          if (selectedShapeTool === PlacementShapeType.CIRCLE) {
            const radius = Math.max(width, height) / 2;
            shape = {
              type: PlacementShapeType.CIRCLE,
              radius: Math.max(0.8, radius),
            };
            onShapeDraw(shape, centerX, centerY);
          } else if (selectedShapeTool === PlacementShapeType.RECTANGLE) {
            shape = {
              type: PlacementShapeType.RECTANGLE,
              width: Math.max(1.0, width),
              height: Math.max(1.0, height),
              cornerRadius: 2,
            };
            onShapeDraw(shape, centerX, centerY, width, height);
          } else if (selectedShapeTool === PlacementShapeType.ELLIPSE) {
            shape = {
              type: PlacementShapeType.ELLIPSE,
              width: Math.max(1.0, width),
              height: Math.max(1.0, height),
            };
            onShapeDraw(shape, centerX, centerY, width, height);
          } else if (selectedShapeTool === PlacementShapeType.POLYGON) {
            const basePoints = [-1, -1, 1, -1, 1.5, 0, 1, 1, -1, 1, -1.5, 0];
            const scaleX = width / 2;
            const scaleY = height / 2;
            const scaledPoints = basePoints.map((p, index) =>
              index % 2 === 0 ? p * scaleX : p * scaleY,
            );
            shape = {
              type: PlacementShapeType.POLYGON,
              points: scaledPoints,
            };
            onShapeDraw(shape, centerX, centerY);
          } else if (selectedShapeTool === PlacementShapeType.SOFA) {
            // Sofa: lock aspect ratio width:height = 10:20 (1:2)
            const SOFA_RATIO_W = 10;
            const SOFA_RATIO_H = 20;
            const size = Math.max(4, Math.max(width, height));
            const sofaWidth = (size * SOFA_RATIO_W) / SOFA_RATIO_H;
            const sofaHeight = size;
            const minW = (4 * SOFA_RATIO_W) / SOFA_RATIO_H;
            shape = {
              type: PlacementShapeType.SOFA,
              width: Math.max(minW, sofaWidth),
              height: Math.max(4, sofaHeight),
              fillColor: "#60a5fa",
              strokeColor: "#2563eb",
            };
            onShapeDraw(shape, centerX, centerY, shape.width, shape.height);
          } else if (selectedShapeTool === PlacementShapeType.STAGE) {
            shape = {
              type: PlacementShapeType.STAGE,
              width: Math.max(20, width),
              height: Math.max(15, height),
              fillColor: "#333333",
              strokeColor: "#2563eb",
            };
            onShapeDraw(shape, centerX, centerY, width, height);
          } else if (selectedShapeTool === PlacementShapeType.SEAT) {
            shape = {
              type: PlacementShapeType.SEAT,
              width: Math.max(1.0, width),
              height: Math.max(1.0, height),
            };
            onShapeDraw(shape, centerX, centerY, width, height);
          }
        }
      }

      setIsDrawingShape(false);
      setDrawStartPos(null);
      setDrawCurrentPos(null);
    },
    [
      isPanning,
      onPanEnd,
      selectionStart,
      selectionCurrent,
      onMarkersInRect,
      seats,
      sections,
      selectedSeatIdSet.size,
      selectedSectionIdSet.size,
      isDrawingShape,
      drawStartPos,
      drawCurrentPos,
      selectedShapeTool,
      onShapeDraw,
    ],
  );

  const handleStageMouseLeave = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      onPanEnd?.();
    }
    setSelectionStart(null);
    setSelectionCurrent(null);
  }, [isPanning, onPanEnd]);

  const handleBackgroundMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (
        selectedShapeTool === PlacementShapeType.FREEFORM &&
        freeformPath.length > 0
      ) {
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos) setFreeformHoverPos(pointerToPercentage(pos.x, pos.y));
      }
    },
    [selectedShapeTool, freeformPath.length],
  );

  const handleBackgroundClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (ignoreClickRef.current) {
        ignoreClickRef.current = false;
        return;
      }
      if (selectedShapeTool === PlacementShapeType.FREEFORM && onShapeDraw) {
        e.cancelBubble = true;
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos) {
          handleFreeformClick(pointerToPercentage(pos.x, pos.y));
          return;
        }
      }
      const target = e.target;
      if (
        target?.name() === "background-image" &&
        !selectedShapeTool &&
        !isDrawingShape
      ) {
        onDeselect?.();
      }
      if (onImageClick) {
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos) {
          onImageClick(e, pointerToPercentage(pos.x, pos.y));
        } else {
          onImageClick(e);
        }
      }
    },
    [
      selectedShapeTool,
      onShapeDraw,
      isDrawingShape,
      handleFreeformClick,
      onDeselect,
      onImageClick,
    ],
  );

  const handleBackgroundDblClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (
        selectedShapeTool === PlacementShapeType.FREEFORM &&
        freeformPath.length >= 2 &&
        onShapeDraw
      ) {
        e.cancelBubble = true;
        completeFreeformShape(freeformPath);
      }
    },
    [selectedShapeTool, freeformPath, onShapeDraw, completeFreeformShape],
  );

  const handleBackgroundTap = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      const target = e.target;
      if (
        target?.name() === "background-image" &&
        !selectedShapeTool &&
        !isDrawingShape
      ) {
        onDeselect?.();
      }
    },
    [selectedShapeTool, isDrawingShape, onDeselect],
  );

  const handleOverlayLayerClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (selectedShapeTool === PlacementShapeType.FREEFORM && onShapeDraw) {
        const target = e.target;
        if (
          target?.name() === "seat-marker" ||
          target?.name() === "section-marker"
        )
          return;
        e.cancelBubble = true;
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos) handleFreeformClick(pointerToPercentage(pos.x, pos.y));
      }
    },
    [selectedShapeTool, onShapeDraw, handleFreeformClick],
  );

  // Throttled redraw during transform so other selected objects' boxes update in real time
  const transformProgressRafRef = useRef<number | null>(null);
  const handleTransformProgress = useCallback(() => {
    if (transformProgressRafRef.current !== null) return;
    transformProgressRafRef.current = requestAnimationFrame(() => {
      stageRef.current?.batchDraw();
      transformProgressRafRef.current = null;
    });
  }, []);

  // Handle Space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't prevent default if user is typing in an input field
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest("input, textarea, [contenteditable]");

      // Handle Delete/Backspace to delete last freeform point
      if ((e.key === "Delete" || e.key === "Backspace") && !isInputField) {
        if (
          selectedShapeTool === PlacementShapeType.FREEFORM &&
          freeformPath.length > 0
        ) {
          e.preventDefault();
          setFreeformPath((prev) => {
            const newPath = prev.slice(0, -1); // Remove last point
            if (newPath.length === 0) {
              setFreeformHoverPos(null);
            }
            return newPath;
          });
        }
        return;
      }

      if (e.code === "Space" && !e.repeat && !isInputField) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Don't prevent default if user is typing in an input field
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest("input, textarea, [contenteditable]");

      if (e.code === "Space" && !isInputField) {
        e.preventDefault();
        setIsSpacePressed(false);
        if (isPanning) {
          setIsPanning(false);
          onPanEnd?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPanning, onPanEnd, selectedShapeTool, freeformPath]);

  // Load image
  useEffect(() => {
    if (!imageUrl) {
      setImage(null);
      setImageLoading(false);
      return;
    }

    // Check if we already have this image loaded
    if (image && (image.src === imageUrl || image.src.endsWith(imageUrl))) {
      setImageLoading(false);
      return;
    }

    setImageLoading(true);
    const img = new window.Image();
    img.crossOrigin = "anonymous";

    const handleLoad = () => {
      setImage(img);
      setImageLoading(false);
    };

    const handleError = () => {
      console.error("Failed to load image:", imageUrl);
      setImage(null);
      setImageLoading(false);
    };

    img.onload = handleLoad;
    img.onerror = handleError;
    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  // Compute display dimensions for coordinate conversion.
  //
  // WITH IMAGE: use live container size (responsive); the image letterboxes.
  // WITHOUT IMAGE: lock the canvas size from the first measurement so the
  //   Stage stays fixed and markers don't shift on resize — just like the
  //   image case where the image provides a fixed reference frame.
  const hasImage = !!image && !!image.width && !!image.height;

  // Lock size for no-image; reset when an image appears
  if (!hasImage && containerWidth > 0 && containerHeight > 0) {
    if (!noImageInitialSizeRef.current) {
      noImageInitialSizeRef.current = { w: containerWidth, h: containerHeight };
    }
  } else if (hasImage) {
    noImageInitialSizeRef.current = null;
  }

  let coordValidWidth = 800;
  if (hasImage) {
    coordValidWidth = containerWidth > 0 ? containerWidth : 800;
  } else {
    coordValidWidth =
      noImageInitialSizeRef.current?.w ??
      (containerWidth > 0 ? containerWidth : 800);
  }
  let coordValidHeight = 600;
  if (hasImage) {
    coordValidHeight = containerHeight > 0 ? containerHeight : 600;
  } else {
    coordValidHeight =
      noImageInitialSizeRef.current?.h ??
      (containerHeight > 0 ? containerHeight : 600);
  }

  const contentAspectRatio = hasImage
    ? image!.height / image!.width
    : NO_IMAGE_ASPECT_RATIO;

  const {
    displayedWidth: coordDisplayedWidth,
    displayedHeight: coordDisplayedHeight,
    imageX: coordImageX,
    imageY: coordImageY,
    centerX,
    centerY,
    percentageToStage,
    layerToPercentage,
    stageToPercentage,
    pointerToPercentage,
  } = useLetterboxing({
    containerWidth: coordValidWidth,
    containerHeight: coordValidHeight,
    contentAspectRatio,
    panOffset,
    zoomLevel,
  });

  // Handle seat drag end (node.x/y are layer-local)
  const handleSeatDragEnd = useCallback(
    (seatId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const { x, y } = layerToPercentage(node.x(), node.y());
      setDraggedSeatId(null);
      setDragPosition(null);

      // Select on drag end when was unselected: one motion to drag without prior click
      const wasUnselected = !selectedSeatIdSet.has(seatId);
      if (wasUnselected) {
        const seat = seats.find((s) => s.id === seatId);
        if (seat && onSeatClick) onSeatClick(seat, { shiftKey: false });
      }

      if (batchDragState?.type === "seats" && onBatchSeatDragEnd) {
        const initial = batchDragState.initialPositions.get(seatId);
        if (initial) {
          const dx = x - initial.x;
          const dy = y - initial.y;
          const updates = Array.from(
            batchDragState.initialPositions.entries(),
          ).map(([id, pos]) => ({
            id,
            x: Math.max(0, Math.min(100, pos.x + dx)),
            y: Math.max(0, Math.min(100, pos.y + dy)),
          }));
          onBatchSeatDragEnd(updates);
        }
        setBatchDragState(null);
        setBatchDragDelta(null);
      } else {
        onSeatDragEnd(seatId, x, y);
      }
    },
    [
      onSeatDragEnd,
      onBatchSeatDragEnd,
      layerToPercentage,
      batchDragState,
      seats,
      selectedSeatIdSet,
      onSeatClick,
    ],
  );

  const handleSeatDragStart = useCallback(
    (seatId: string) => {
      setDraggedSeatId(seatId);
      const seat = seats.find((s) => s.id === seatId);
      if (seat) setDragPosition({ x: seat.x, y: seat.y });

      if (
        selectedSeatIdSet.size > 1 &&
        selectedSeatIdSet.has(seatId) &&
        onBatchSeatDragEnd
      ) {
        const initialPositions = new Map<string, { x: number; y: number }>();
        seats
          .filter((s) => selectedSeatIdSet.has(s.id))
          .forEach((s) => initialPositions.set(s.id, { x: s.x, y: s.y }));
        setBatchDragState({
          type: "seats",
          initialPositions,
          draggedId: seatId,
        });
        setBatchDragDelta({ dx: 0, dy: 0 });
      }
    },
    [seats, selectedSeatIdSet, onBatchSeatDragEnd],
  );

  const handleSeatDragMove = useCallback(
    (seatId: string, layerX: number, layerY: number) => {
      const { x, y } = layerToPercentage(layerX, layerY);
      setDragPosition({ x, y });

      if (
        batchDragState?.type === "seats" &&
        batchDragState.draggedId === seatId
      ) {
        const initial = batchDragState.initialPositions.get(seatId);
        if (initial) {
          setBatchDragDelta({ dx: x - initial.x, dy: y - initial.y });
        }
      }
    },
    [layerToPercentage, batchDragState],
  );

  const handleSectionDragEnd = useCallback(
    (sectionId: string, layerX: number, layerY: number) => {
      const { x, y } = layerToPercentage(layerX, layerY);
      setDraggedSectionId(null);
      setDragPosition(null);

      // Select on drag end when was unselected: one motion to drag without prior click
      const wasUnselected = !selectedSectionIdSet.has(sectionId);
      if (wasUnselected) {
        const section = sections.find((s) => s.id === sectionId);
        if (section && onSectionClick)
          onSectionClick(section, { shiftKey: false });
      }

      if (batchDragState?.type === "sections" && onBatchSectionDragEnd) {
        const initial = batchDragState.initialPositions.get(sectionId);
        if (initial) {
          const dx = x - initial.x;
          const dy = y - initial.y;
          const updates = Array.from(
            batchDragState.initialPositions.entries(),
          ).map(([id, pos]) => ({
            id,
            x: Math.max(0, Math.min(100, pos.x + dx)),
            y: Math.max(0, Math.min(100, pos.y + dy)),
          }));
          onBatchSectionDragEnd(updates);
        }
        setBatchDragState(null);
        setBatchDragDelta(null);
      } else {
        onSectionDragEnd?.(sectionId, x, y);
      }
    },
    [
      onSectionDragEnd,
      onBatchSectionDragEnd,
      layerToPercentage,
      batchDragState,
      sections,
      selectedSectionIdSet,
      onSectionClick,
    ],
  );

  const handleSectionDragStart = useCallback(
    (sectionId: string) => {
      setDraggedSectionId(sectionId);
      const section = sections.find((s) => s.id === sectionId);
      if (section) setDragPosition({ x: section.x, y: section.y });

      if (
        selectedSectionIdSet.size > 1 &&
        selectedSectionIdSet.has(sectionId) &&
        onBatchSectionDragEnd
      ) {
        const initialPositions = new Map<string, { x: number; y: number }>();
        sections
          .filter((s) => selectedSectionIdSet.has(s.id))
          .forEach((s) => initialPositions.set(s.id, { x: s.x, y: s.y }));
        setBatchDragState({
          type: "sections",
          initialPositions,
          draggedId: sectionId,
        });
        setBatchDragDelta({ dx: 0, dy: 0 });
      }
    },
    [sections, selectedSectionIdSet, onBatchSectionDragEnd],
  );

  const handleSectionDragMove = useCallback(
    (sectionId: string, layerX: number, layerY: number) => {
      const { x, y } = layerToPercentage(layerX, layerY);
      setDragPosition({ x, y });

      if (
        batchDragState?.type === "sections" &&
        batchDragState.draggedId === sectionId
      ) {
        const initial = batchDragState.initialPositions.get(sectionId);
        if (initial) {
          setBatchDragDelta({ dx: x - initial.x, dy: y - initial.y });
        }
      }
    },
    [layerToPercentage, batchDragState],
  );

  // Use the same locked dimensions for the Stage size
  const validWidth = coordValidWidth;
  const validHeight = coordValidHeight;

  // Compute display dimensions (no-image = use full container for simple floor mode)
  // centerX/centerY already defined above for coordinate conversion
  const displayedWidth = coordDisplayedWidth;
  const displayedHeight = coordDisplayedHeight;
  const imageX = coordImageX;
  const imageY = coordImageY;

  // Viewport virtualization - MUST be before any early return to keep hook order consistent
  const { visibleSeats, visibleSections, visibleShapeOverlays } =
    useMemo(() => {
      const totalCount = seats.length + sections.length + shapeOverlays.length;
      if (totalCount < VIRTUALIZATION_THRESHOLD) {
        return {
          visibleSeats: seats,
          visibleSections: sections,
          visibleShapeOverlays: shapeOverlays,
        };
      }

      const padding = 0.2;
      const minLayerX =
        centerX -
        (centerX + panOffset.x) / zoomLevel -
        (validWidth * padding) / zoomLevel;
      const maxLayerX =
        centerX +
        (validWidth - centerX - panOffset.x) / zoomLevel +
        (validWidth * padding) / zoomLevel;
      const minLayerY =
        centerY -
        (centerY + panOffset.y) / zoomLevel -
        (validHeight * padding) / zoomLevel;
      const maxLayerY =
        centerY +
        (validHeight - centerY - panOffset.y) / zoomLevel +
        (validHeight * padding) / zoomLevel;

      const isInView = (px: number, py: number) => {
        const layerX = imageX + (px / 100) * displayedWidth;
        const layerY = imageY + (py / 100) * displayedHeight;
        return (
          layerX >= minLayerX &&
          layerX <= maxLayerX &&
          layerY >= minLayerY &&
          layerY <= maxLayerY
        );
      };

      const visibleSeats = seats.filter((s) => {
        if (selectedSeatIdSet.has(s.id)) return true;
        return isInView(s.x, s.y);
      });
      const visibleSections = sections.filter((s) => {
        if (selectedSectionIdSet.has(s.id)) return true;
        return isInView(s.x, s.y);
      });
      const visibleShapeOverlays = shapeOverlays.filter((o) => {
        if (selectedOverlayId === o.id) return true;
        return isInView(o.x, o.y);
      });

      return {
        visibleSeats,
        visibleSections,
        visibleShapeOverlays,
      };
    }, [
      seats,
      sections,
      shapeOverlays,
      panOffset,
      zoomLevel,
      validWidth,
      validHeight,
      centerX,
      centerY,
      imageX,
      imageY,
      displayedWidth,
      displayedHeight,
      selectedSeatIdSet,
      selectedSectionIdSet,
      selectedOverlayId,
    ]);

  const totalVisibleCount =
    visibleSeats.length + visibleSections.length + visibleShapeOverlays.length;
  const disableHoverAnimation = totalVisibleCount > HOVER_ANIMATION_THRESHOLD;
  const useLowDetail = zoomLevel < 0.4;

  // Apply batch drag position overrides so all selected items move together
  const displaySeats = useMemo(() => {
    if (!batchDragState || batchDragState.type !== "seats" || !batchDragDelta) {
      return visibleSeats;
    }
    return visibleSeats.map((s) => {
      const initial = batchDragState.initialPositions.get(s.id);
      if (!initial) return s;
      if (s.id === batchDragState.draggedId && dragPosition) {
        return { ...s, x: dragPosition.x, y: dragPosition.y };
      }
      return {
        ...s,
        x: initial.x + batchDragDelta.dx,
        y: initial.y + batchDragDelta.dy,
      };
    });
  }, [visibleSeats, batchDragState, batchDragDelta, dragPosition]);

  const displaySections = useMemo(() => {
    if (
      !batchDragState ||
      batchDragState.type !== "sections" ||
      !batchDragDelta
    ) {
      return visibleSections;
    }
    return visibleSections.map((s) => {
      const initial = batchDragState.initialPositions.get(s.id);
      if (!initial) return s;
      if (s.id === batchDragState.draggedId && dragPosition) {
        return { ...s, x: dragPosition.x, y: dragPosition.y };
      }
      return {
        ...s,
        x: initial.x + batchDragDelta.dx,
        y: initial.y + batchDragDelta.dy,
      };
    });
  }, [visibleSections, batchDragState, batchDragDelta, dragPosition]);

  const layerTransform = {
    x: centerX + panOffset.x,
    y: centerY + panOffset.y,
    scaleX: zoomLevel,
    scaleY: zoomLevel,
    offsetX: centerX,
    offsetY: centerY,
  };

  const staticSeats = displaySeats.filter((s) => !selectedSeatIdSet.has(s.id));
  const selectedSeats = displaySeats.filter((s) => selectedSeatIdSet.has(s.id));
  const draggedSeat = displaySeats.find((s) => s.id === draggedSeatId);

  const staticSections = displaySections.filter(
    (s) => !selectedSectionIdSet.has(s.id),
  );
  const selectedSections = displaySections.filter((s) =>
    selectedSectionIdSet.has(s.id),
  );
  const selectedSection = displaySections.find(
    (s) => s.id === selectedSectionId,
  );
  const draggedSection = displaySections.find((s) => s.id === draggedSectionId);

  // Image has priority over canvas background color: only use canvas background when there is no image.
  // Show loading indicator when imageUrl is set but image not yet loaded (use neutral bg, not canvas color).
  if (imageUrl && (imageLoading || !image || !image.width || !image.height)) {
    return (
      <div
        style={{
          width: validWidth,
          height: validHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
          borderRadius: "0.5rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid #e5e7eb",
              borderTop: "4px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#6b7280", fontSize: "14px" }}>Loading image...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  let stageCursor: React.CSSProperties["cursor"] = "pointer";
  if (isPanning || isSpacePressed) stageCursor = "grab";
  else if (selectedShapeTool) stageCursor = "crosshair";

  return (
    <Stage
      ref={stageRef}
      width={validWidth}
      height={validHeight}
      onWheel={handleStageWheel}
      onTouchStart={handleStageTouchStart}
      onMouseDown={handleStageMouseDown}
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
      onMouseLeave={handleStageMouseLeave}
      style={{
        display: "block",
        willChange: "transform",
        cursor: stageCursor,
      }}
    >
      <BackgroundLayer
        layerRef={layerRef}
        layerTransform={layerTransform}
        showGrid={showGrid}
        gridSize={gridSize}
        validWidth={validWidth}
        validHeight={validHeight}
        imageX={imageX}
        imageY={imageY}
        displayedWidth={displayedWidth}
        displayedHeight={displayedHeight}
        canvasBackgroundColor={canvasBackgroundColor}
        image={image}
        onBackgroundMouseMove={handleBackgroundMouseMove}
        onBackgroundClick={handleBackgroundClick}
        onBackgroundDblClick={handleBackgroundDblClick}
        onBackgroundTap={handleBackgroundTap}
      />

      <StaticMarkersLayer
        layer={{ layerTransform }}
        data={{
          staticSeats,
          staticSections,
          visibleShapeOverlays,
          designMode,
        }}
        selection={{
          selectedSeatIdSet,
          selectedSectionIdSet,
          selectedOverlayId,
        }}
        canvas={{
          percentageToStage,
          layerToPercentage,
          displayedWidth,
          displayedHeight,
        }}
        display={{
          useLowDetail,
          disableHoverAnimation,
          readOnly,
          selectedShapeTool,
        }}
        drag={{
          draggedSeatId,
          draggedSectionId,
          dragPosition,
        }}
        handlers={{
          isPlacingSeats,
          isPlacingSections,
          isPanning,
          isSpacePressed,
          onSeatClick,
          onSectionClick,
          onSectionDoubleClick,
          onSeatDragEnd: handleSeatDragEnd,
          onSeatDragStart: handleSeatDragStart,
          onSeatDragMove: handleSeatDragMove,
          onSectionDragEnd: handleSectionDragEnd,
          onSectionDragMove: handleSectionDragMove,
          onSectionDragStart: handleSectionDragStart,
          onSeatShapeTransform: onSeatShapeTransform,
          onSectionShapeTransform: onSectionShapeTransform,
          onShapeOverlayClick,
        }}
        colors={{
          getSeatMarkerColors,
          getSectionMarkerColors,
        }}
      />

      <InteractiveMarkersLayer
        layerTransform={layerTransform}
        selectedSeats={selectedSeats}
        selectedSections={selectedSections}
        draggedSeat={draggedSeat}
        draggedSection={draggedSection}
        designMode={designMode}
        percentageToStage={percentageToStage}
        layerToPercentage={layerToPercentage}
        displayedWidth={displayedWidth}
        displayedHeight={displayedHeight}
        disableHoverAnimation={disableHoverAnimation}
        readOnly={readOnly}
        selectedShapeTool={selectedShapeTool}
        dragPosition={dragPosition}
        handlers={{
          isPlacingSeats,
          isPlacingSections,
          isPanning,
          isSpacePressed,
          onSeatClick,
          onSectionClick,
          onSectionDoubleClick,
          onSeatDragEnd: handleSeatDragEnd,
          onSeatDragStart: handleSeatDragStart,
          onSeatDragMove: handleSeatDragMove,
          onSectionDragEnd: handleSectionDragEnd,
          onSectionDragMove: handleSectionDragMove,
          onSectionDragStart: handleSectionDragStart,
          onSeatShapeTransform: onSeatShapeTransform,
          onSectionShapeTransform: onSectionShapeTransform,
          onShapeOverlayClick,
          onTransformProgress: handleTransformProgress,
        }}
        getSeatMarkerColors={getSeatMarkerColors}
        getSectionMarkerColors={getSectionMarkerColors}
      />

      <OverlayLayer
        layerTransform={layerTransform}
        imageX={imageX}
        imageY={imageY}
        displayedWidth={displayedWidth}
        displayedHeight={displayedHeight}
        selectedShapeTool={selectedShapeTool}
        freeformPath={freeformPath}
        freeformHoverPos={freeformHoverPos}
        isDrawingShape={isDrawingShape}
        drawStartPos={drawStartPos}
        drawCurrentPos={drawCurrentPos}
        percentageToStage={percentageToStage}
        previewShapeRef={previewShapeRef}
        onOverlayLayerClick={handleOverlayLayerClick}
      />

      {selectionStart && selectionCurrent && (
        <SelectionMarqueeLayer
          selectionStart={selectionStart}
          selectionCurrent={selectionCurrent}
        />
      )}
    </Stage>
  );
}
