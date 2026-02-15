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
import {
  Stage,
  Layer,
  Image,
  Circle,
  Group,
  Text,
  Rect,
  Line,
  Transformer,
} from "react-konva";
import Konva from "konva";
import { SeatType } from "../../seats/types";
import {
  PlacementShapeType,
  type PlacementShape,
  type SeatMarker,
  type SectionMarker,
} from "./types";
import {
  DEFAULT_SHAPE_FILL,
  DEFAULT_SHAPE_STROKE,
  MARQUEE_FILL,
  MARQUEE_STROKE,
  SELECTED_FILL,
  SELECTED_STROKE,
  getSeatTypeColors,
} from "./colors";
import { ShapeRenderer } from "./components/shape-renderer";
import { MemoizedShapeOverlayCanvas } from "./canvas/shape-overlay-canvas";
import { MemoizedSeatMarkerCanvas } from "./canvas/seat-marker-canvas";
import { MemoizedSectionMarkerCanvas } from "./canvas/section-marker-canvas";
import {
  useLetterboxing,
  NO_IMAGE_ASPECT_RATIO,
} from "./hooks/use-letterboxing";

interface LayoutCanvasProps {
  /** When undefined/empty, renders blank canvas (simple floor mode) */
  imageUrl?: string;
  seats: SeatMarker[];
  sections?: SectionMarker[];
  selectedSeatId?: string | null;
  selectedSectionId?: string | null;
  /** Multi-selection: all selected seat ids (used for highlight + Delete). */
  selectedSeatIds?: string[];
  /** Multi-selection: all selected section ids (used for highlight + Delete). */
  selectedSectionIds?: string[];
  /** Anchor seat ID - reference object for alignment */
  anchorSeatId?: string | null;
  /** Anchor section ID - reference object for alignment */
  anchorSectionId?: string | null;
  /** Called when user finishes a drag-to-select marquee with markers inside the rect. */
  onMarkersInRect?: (seatIds: string[], sectionIds: string[]) => void;
  isPlacingSeats: boolean;
  isPlacingSections: boolean;
  readOnly?: boolean;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  onSeatClick?: (seat: SeatMarker, event?: { shiftKey?: boolean }) => void;
  onSectionClick?: (
    section: SectionMarker,
    event?: { shiftKey?: boolean },
  ) => void;
  onSectionDoubleClick?: (section: SectionMarker) => void;
  onSectionDragEnd?: (sectionId: string, newX: number, newY: number) => void;
  onSeatDragEnd: (seatId: string, newX: number, newY: number) => void;
  /** Batch move multiple selected seats (called when dragging one of multiple selected) */
  onBatchSeatDragEnd?: (
    updates: Array<{ id: string; x: number; y: number }>,
  ) => void;
  /** Batch move multiple selected sections */
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
  containerWidth: number;
  containerHeight: number;
  venueType: "small" | "large";
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
  /** Background color when no image (simple floor mode). Default #e5e7eb */
  canvasBackgroundColor?: string;
  /** Show grid lines on canvas */
  showGrid?: boolean;
  /** Grid size in percentage */
  gridSize?: number;
}

// Threshold: only virtualize when we have more than this many objects
const VIRTUALIZATION_THRESHOLD = 40;

// Threshold: disable hover animations when total count exceeds this
const HOVER_ANIMATION_THRESHOLD = 100;

export function LayoutCanvas({
  imageUrl,
  seats,
  sections = [],
  selectedSeatId,
  selectedSectionId,
  selectedSeatIds: selectedSeatIdsProp,
  selectedSectionIds: selectedSectionIdsProp,
  anchorSeatId,
  anchorSectionId,
  onMarkersInRect,
  isPlacingSeats,
  isPlacingSections,
  readOnly = false,
  zoomLevel,
  panOffset,
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
  containerWidth,
  containerHeight,
  venueType,
  selectedShapeTool,
  shapeOverlays = [],
  selectedOverlayId,
  canvasBackgroundColor = "#e5e7eb",
  showGrid = false,
  gridSize = 5,
}: LayoutCanvasProps) {
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
  const selectedSeatIdSet = useMemo(() => {
    if (selectedSeatIdsProp && selectedSeatIdsProp.length > 0) {
      return new Set(selectedSeatIdsProp);
    }
    return new Set(selectedSeatId ? [selectedSeatId] : []);
  }, [selectedSeatIdsProp, selectedSeatId]);
  const selectedSectionIdSet = useMemo(() => {
    if (selectedSectionIdsProp && selectedSectionIdsProp.length > 0) {
      return new Set(selectedSectionIdsProp);
    }
    return new Set(selectedSectionId ? [selectedSectionId] : []);
  }, [selectedSectionIdsProp, selectedSectionId]);

  // Ref to prevent click event after drag-to-draw
  const ignoreClickRef = useRef(false);

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

  // Get seat color based on type using centralized color constants
  const getSeatColor = (seatType: SeatType) => {
    return getSeatTypeColors(seatType);
  };

  // Use shape fill/stroke when set; fall back to type-based default for the other
  const getSeatMarkerColors = (seat: SeatMarker) => {
    const defaults = getSeatColor(seat.seat.seatType);
    const fill = seat.shape?.fillColor?.trim();
    const stroke = seat.shape?.strokeColor?.trim();
    return {
      fill: fill || defaults.fill,
      stroke: stroke || defaults.stroke,
    };
  };

  // Use shape fill/stroke when set; fall back to default for the other
  const getSectionMarkerColors = (section: SectionMarker) => {
    const defaultFill = "#60a5fa";
    const defaultStroke = "#2563eb";
    const fill = section.shape?.fillColor?.trim();
    const stroke = section.shape?.strokeColor?.trim();
    return {
      fill: fill || defaultFill,
      stroke: stroke || defaultStroke,
    };
  };

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

  const coordValidWidth = hasImage
    ? containerWidth > 0
      ? containerWidth
      : 800
    : (noImageInitialSizeRef.current?.w ??
      (containerWidth > 0 ? containerWidth : 800));
  const coordValidHeight = hasImage
    ? containerHeight > 0
      ? containerHeight
      : 600
    : (noImageInitialSizeRef.current?.h ??
      (containerHeight > 0 ? containerHeight : 600));

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
        if (section && onSectionClick) onSectionClick(section, { shiftKey: false });
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

  const staticSeats = displaySeats.filter(
    (s) => !selectedSeatIdSet.has(s.id),
  );
  const selectedSeats = displaySeats.filter((s) => selectedSeatIdSet.has(s.id));
  const selectedSeat = displaySeats.find((s) => s.id === selectedSeatId);
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

  return (
    <Stage
      ref={stageRef}
      width={validWidth}
      height={validHeight}
      onWheel={(e) => {
        // Always prevent default to stop page from scrolling
        e.evt.preventDefault();
        onWheel?.(e, isSpacePressed);
      }}
      onTouchStart={(e) => {
        // Prevent browser from handling touch as scroll
        if (e.evt) {
          e.evt.preventDefault();
        }
      }}
      onMouseDown={(e) => {
        // Reset ignore click ref on new interaction
        ignoreClickRef.current = false;

        // Prevent default browser behavior (scrolling, text selection)
        if (e.evt) {
          e.evt.preventDefault();
        }

        const stage = e.target.getStage();
        if (!stage) return;

        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;

        // If Space is pressed, start panning
        if (isSpacePressed) {
          setIsPanning(true);
          setPanStartPos(pointerPos);
          onPanStart?.();
          return;
        }

        const target = e.target;
        const targetType = target.getType();

        // Detect if click is on a marker or transformer (don't start marquee in those cases)
        const isTransformer = targetType === "Transformer";
        let current: Konva.Node | null = target;
        let isTransformerRelated = false;
        while (current) {
          if (current.getType() === "Transformer") {
            isTransformerRelated = true;
            break;
          }
          current = current.getParent();
        }

        const isMarkerGroup =
          target.name() === "seat-marker" || target.name() === "section-marker";
        const isMarkerChild =
          target.getParent()?.name() === "seat-marker" ||
          target.getParent()?.name() === "section-marker";
        let ancestor: Konva.Node | null = target.getParent();
        let isMarkerAncestor = false;
        while (ancestor) {
          if (
            ancestor.name() === "seat-marker" ||
            ancestor.name() === "section-marker"
          ) {
            isMarkerAncestor = true;
            break;
          }
          ancestor = ancestor.getParent();
        }

        const isClickOnMarkerOrTransformer =
          isTransformer ||
          isTransformerRelated ||
          isMarkerGroup ||
          isMarkerChild ||
          isMarkerAncestor;

        // Drag-to-select: start marquee when clicking on empty area (not on a marker/transformer) and no shape tool
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
          return;
        }
      }}
      onMouseMove={(e) => {
        const stage = e.target.getStage();
        if (!stage) return;

        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;

        // Update drag-to-select marquee
        if (selectionStart) {
          setSelectionCurrent(pointerPos);
          return;
        }

        const target = e.target;
        const targetType = target.getType();
        const isTransformer = targetType === "Transformer";
        let current: Konva.Node | null = target;
        let isTransformerRelated = false;
        while (current) {
          if (current.getType() === "Transformer") {
            isTransformerRelated = true;
            break;
          }
          current = current.getParent();
        }

        const isMarkerGroup =
          target.name() === "seat-marker" || target.name() === "section-marker";
        const isMarkerChild =
          target.getParent()?.name() === "seat-marker" ||
          target.getParent()?.name() === "section-marker";
        let ancestor: Konva.Node | null = target.getParent();
        let isMarkerAncestor = false;
        while (ancestor) {
          if (
            ancestor.name() === "seat-marker" ||
            ancestor.name() === "section-marker"
          ) {
            isMarkerAncestor = true;
            break;
          }
          ancestor = ancestor.getParent();
        }
        const hasSelectedMarker =
          selectedSeatIdSet.size > 0 || selectedSectionIdSet.size > 0;
        const isInteractingWithMarker =
          hasSelectedMarker &&
          (isTransformer ||
            isTransformerRelated ||
            isMarkerGroup ||
            isMarkerChild ||
            isMarkerAncestor);

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
          const percentageCoords = pointerToPercentage(
            pointerPos.x,
            pointerPos.y,
          );
          setDrawCurrentPos(percentageCoords);
        } else if (
          !isInteractingWithMarker &&
          selectedShapeTool === PlacementShapeType.FREEFORM &&
          freeformPath.length > 0
        ) {
          const percentageCoords = pointerToPercentage(
            pointerPos.x,
            pointerPos.y,
          );
          setFreeformHoverPos(percentageCoords);
        }
      }}
      onMouseUp={(e) => {
        if (isPanning) {
          setIsPanning(false);
          onPanEnd?.();
          return;
        }

        // Finish drag-to-select marquee
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
              (s) =>
                s.x >= minPx && s.x <= maxPx && s.y >= minPy && s.y <= maxPy,
            )
            .map((s) => s.id);
          const sectionIds = sections
            .filter(
              (s) =>
                s.x >= minPx && s.x <= maxPx && s.y >= minPy && s.y <= maxPy,
            )
            .map((s) => s.id);
          onMarkersInRect(seatIds, sectionIds);
          setSelectionStart(null);
          setSelectionCurrent(null);
          return;
        }

        const target = e.target;
        const targetType = target.getType();
        const isTransformer = targetType === "Transformer";
        let current: Konva.Node | null = target;
        let isTransformerRelated = false;
        while (current) {
          if (current.getType() === "Transformer") {
            isTransformerRelated = true;
            break;
          }
          current = current.getParent();
        }

        const isMarkerGroup =
          target.name() === "seat-marker" || target.name() === "section-marker";
        const isMarkerChild =
          target.getParent()?.name() === "seat-marker" ||
          target.getParent()?.name() === "section-marker";
        let ancestor: Konva.Node | null = target.getParent();
        let isMarkerAncestor = false;
        while (ancestor) {
          if (
            ancestor.name() === "seat-marker" ||
            ancestor.name() === "section-marker"
          ) {
            isMarkerAncestor = true;
            break;
          }
          ancestor = ancestor.getParent();
        }
        const hasSelectedMarker =
          selectedSeatIdSet.size > 0 || selectedSectionIdSet.size > 0;
        const isInteractingWithMarker =
          hasSelectedMarker &&
          (isTransformer ||
            isTransformerRelated ||
            isMarkerGroup ||
            isMarkerChild ||
            isMarkerAncestor);

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
          onShapeDraw
        ) {
          // Freeform is now handled via click-to-add-points, not mouseUp
          // So we skip it here and only handle other shape types
          if (
            selectedShapeTool !== PlacementShapeType.FREEFORM &&
            drawCurrentPos
          ) {
            // Handle other shape types (drag to draw)
            const startX = drawStartPos.x;
            const startY = drawStartPos.y;
            const endX = drawCurrentPos.x;
            const endY = drawCurrentPos.y;

            // Calculate distance moved - require minimum drag distance
            const distance = Math.sqrt(
              Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2),
            );
            const minDragDistance = 0.3; // 0.3% of image - minimum drag distance to create shape

            if (distance >= minDragDistance) {
              // Prevent click event from propagating to Image onClick handler
              // This prevents duplicate creation (one from drag, one from click)
              e.cancelBubble = true;

              // Set ref to ignore subsequent click event
              ignoreClickRef.current = true;

              // Valid drag - create shape with dragged dimensions
              const minSize = 1.5; // 1.5% of image
              const width = Math.max(minSize, Math.abs(endX - startX));
              const height = Math.max(minSize, Math.abs(endY - startY));

              const centerX = (startX + endX) / 2;
              const centerY = (startY + endY) / 2;

              // Create shape based on type with reasonable defaults
              let shape: PlacementShape;
              if (selectedShapeTool === PlacementShapeType.CIRCLE) {
                const radius = Math.max(width, height) / 2;
                shape = {
                  type: PlacementShapeType.CIRCLE,
                  radius: Math.max(0.8, radius), // Minimum 0.8% for visibility
                };
                onShapeDraw(shape, centerX, centerY);
              } else if (selectedShapeTool === PlacementShapeType.RECTANGLE) {
                shape = {
                  type: PlacementShapeType.RECTANGLE,
                  width: Math.max(1.0, width),
                  height: Math.max(1.0, height),
                  cornerRadius: 2, // Slight rounding for better appearance
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
                // For polygon, use hexagon shape scaled to drag size
                // Base hexagon points (relative to center)
                const basePoints = [
                  -1, -1, 1, -1, 1.5, 0, 1, 1, -1, 1, -1.5, 0,
                ];
                // Scale points based on drag dimensions
                const scaleX = width / 2; // Divide by 2 because base points range from -1.5 to 1.5
                const scaleY = height / 2;
                const scaledPoints = basePoints.map((p, index) => {
                  if (index % 2 === 0) {
                    // x coordinate
                    return p * scaleX;
                  } else {
                    // y coordinate
                    return p * scaleY;
                  }
                });
                shape = {
                  type: PlacementShapeType.POLYGON,
                  points: scaledPoints,
                };

                onShapeDraw(shape, centerX, centerY);
              } else if (selectedShapeTool === PlacementShapeType.SOFA) {
                shape = {
                  type: PlacementShapeType.SOFA,
                  width: Math.max(5, width),
                  height: Math.max(4, height),
                  fillColor: "#60a5fa",
                  strokeColor: "#2563eb",
                };
                onShapeDraw(shape, centerX, centerY, width, height);
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
          // If drag was too small, just cancel the drawing without creating anything

          // Reset drawing state
          setIsDrawingShape(false);
          setDrawStartPos(null);
          setDrawCurrentPos(null);
        }
      }}
      onMouseLeave={() => {
        if (isPanning) {
          setIsPanning(false);
          onPanEnd?.();
        }
        setSelectionStart(null);
        setSelectionCurrent(null);
      }}
      style={{
        display: "block",
        willChange: "transform",
        cursor:
          isPanning || isSpacePressed
            ? "grab"
            : selectedShapeTool
              ? "crosshair"
              : "pointer", // Pointer tool shows pointer cursor
      }}
    >
      {/* Background Layer: Grid lines (when enabled), canvas background, and image */}
      <Layer ref={layerRef} {...layerTransform} listening={true}>
        {/* Grid lines - rendered behind everything */}
        {showGrid && gridSize > 0 && (
          <Group listening={false}>
            {(() => {
              const gridLines: Array<{
                x1: number;
                y1: number;
                x2: number;
                y2: number;
              }> = [];

              // Generate vertical grid lines
              for (
                let percentage = gridSize;
                percentage < 100;
                percentage += gridSize
              ) {
                const x = (percentage / 100) * validWidth;
                gridLines.push({
                  x1: x,
                  y1: 0,
                  x2: x,
                  y2: validHeight,
                });
              }

              // Generate horizontal grid lines
              for (
                let percentage = gridSize;
                percentage < 100;
                percentage += gridSize
              ) {
                const y = (percentage / 100) * validHeight;
                gridLines.push({
                  x1: 0,
                  y1: y,
                  x2: validWidth,
                  y2: y,
                });
              }

              return gridLines.map((line, index) => (
                <Line
                  key={`grid-line-${index}`}
                  points={[line.x1, line.y1, line.x2, line.y2]}
                  stroke="rgba(100, 150, 255, 0.2)"
                  strokeWidth={1}
                  perfectDrawEnabled={false}
                  dash={[2, 2]}
                />
              ));
            })()}
          </Group>
        )}
        {/* Background rectangle - always rendered to support transparency and consistent background color */}
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
            onMouseMove={(e) => {
              if (
                selectedShapeTool === PlacementShapeType.FREEFORM &&
                freeformPath.length > 0
              ) {
                const pointerPos = e.target.getStage()?.getPointerPosition();
                if (pointerPos) {
                  const percentageCoords = pointerToPercentage(
                    pointerPos.x,
                    pointerPos.y,
                  );
                  setFreeformHoverPos(percentageCoords);
                }
              }
            }}
            onClick={(e) => {
              if (ignoreClickRef.current) {
                ignoreClickRef.current = false;
                return;
              }
              if (
                selectedShapeTool === PlacementShapeType.FREEFORM &&
                onShapeDraw
              ) {
                e.cancelBubble = true;
                const pointerPos = e.target.getStage()?.getPointerPosition();
                if (pointerPos) {
                  const percentageCoords = pointerToPercentage(
                    pointerPos.x,
                    pointerPos.y,
                  );
                  if (freeformPath.length >= 2) {
                    const firstPoint = freeformPath[0];
                    const distanceToStart = Math.sqrt(
                      Math.pow(percentageCoords.x - firstPoint.x, 2) +
                        Math.pow(percentageCoords.y - firstPoint.y, 2),
                    );
                    if (distanceToStart < 1.5) {
                      const finalPath = [...freeformPath, firstPoint];
                      const sumX = finalPath.reduce((sum, p) => sum + p.x, 0);
                      const sumY = finalPath.reduce((sum, p) => sum + p.y, 0);
                      const cx = sumX / finalPath.length;
                      const cy = sumY / finalPath.length;
                      const points: number[] = [];
                      finalPath.forEach((point) => {
                        points.push(point.x - cx, point.y - cy);
                      });
                      const shape: PlacementShape = {
                        type: PlacementShapeType.FREEFORM,
                        points,
                      };
                      onShapeDraw(shape, cx, cy);
                      setFreeformPath([]);
                      setFreeformHoverPos(null);
                      return;
                    }
                  }
                  setFreeformPath((prev) => {
                    if (prev.length === 0) return [percentageCoords];
                    const lastPoint = prev[prev.length - 1];
                    const distanceInPercent = Math.sqrt(
                      Math.pow(percentageCoords.x - lastPoint.x, 2) +
                        Math.pow(percentageCoords.y - lastPoint.y, 2),
                    );
                    if (distanceInPercent >= 0.1)
                      return [...prev, percentageCoords];
                    return prev;
                  });
                }
                return;
              }
              const target = e.target;
              if (
                target &&
                target.name() === "background-image" &&
                !selectedShapeTool &&
                !isDrawingShape
              ) {
                onDeselect?.();
              }
              if (onImageClick) {
                const pointerPos = e.target.getStage()?.getPointerPosition();
                if (pointerPos) {
                  const percentageCoords = pointerToPercentage(
                    pointerPos.x,
                    pointerPos.y,
                  );
                  onImageClick(e, percentageCoords);
                } else {
                  onImageClick(e);
                }
              }
            }}
            onDblClick={(e) => {
              if (
                selectedShapeTool === PlacementShapeType.FREEFORM &&
                freeformPath.length >= 2 &&
                onShapeDraw
              ) {
                e.cancelBubble = true;
                const finalPath = [...freeformPath, freeformPath[0]];
                const sumX = finalPath.reduce((sum, p) => sum + p.x, 0);
                const sumY = finalPath.reduce((sum, p) => sum + p.y, 0);
                const cx = sumX / finalPath.length;
                const cy = sumY / finalPath.length;
                const points: number[] = [];
                finalPath.forEach((point) => {
                  points.push(point.x - cx, point.y - cy);
                });
                const shape: PlacementShape = {
                  type: PlacementShapeType.FREEFORM,
                  points,
                };
                onShapeDraw(shape, cx, cy);
                setFreeformPath([]);
                setFreeformHoverPos(null);
              }
            }}
            onTap={(e) => {
              const target = e.target;
              if (
                target &&
                target.name() === "background-image" &&
                !selectedShapeTool &&
                !isDrawingShape
              ) {
                onDeselect?.();
              }
            }}
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
            onMouseMove={(e) => {
              if (
                selectedShapeTool === PlacementShapeType.FREEFORM &&
                freeformPath.length > 0
              ) {
                const pointerPos = e.target.getStage()?.getPointerPosition();
                if (pointerPos) {
                  const percentageCoords = pointerToPercentage(
                    pointerPos.x,
                    pointerPos.y,
                  );
                  setFreeformHoverPos(percentageCoords);
                }
              }
            }}
            onClick={(e) => {
              if (ignoreClickRef.current) {
                ignoreClickRef.current = false;
                return;
              }
              if (
                selectedShapeTool === PlacementShapeType.FREEFORM &&
                onShapeDraw
              ) {
                e.cancelBubble = true;
                const pointerPos = e.target.getStage()?.getPointerPosition();
                if (pointerPos) {
                  const percentageCoords = pointerToPercentage(
                    pointerPos.x,
                    pointerPos.y,
                  );
                  if (freeformPath.length >= 2) {
                    const firstPoint = freeformPath[0];
                    const distanceToStart = Math.sqrt(
                      Math.pow(percentageCoords.x - firstPoint.x, 2) +
                        Math.pow(percentageCoords.y - firstPoint.y, 2),
                    );
                    if (distanceToStart < 1.5) {
                      const finalPath = [...freeformPath, firstPoint];
                      const sumX = finalPath.reduce((sum, p) => sum + p.x, 0);
                      const sumY = finalPath.reduce((sum, p) => sum + p.y, 0);
                      const cx = sumX / finalPath.length;
                      const cy = sumY / finalPath.length;
                      const points: number[] = [];
                      finalPath.forEach((point) => {
                        points.push(point.x - cx, point.y - cy);
                      });
                      const shape: PlacementShape = {
                        type: PlacementShapeType.FREEFORM,
                        points,
                      };
                      onShapeDraw(shape, cx, cy);
                      setFreeformPath([]);
                      setFreeformHoverPos(null);
                      return;
                    }
                  }
                  setFreeformPath((prev) => {
                    if (prev.length === 0) return [percentageCoords];
                    const lastPoint = prev[prev.length - 1];
                    const distanceInPercent = Math.sqrt(
                      Math.pow(percentageCoords.x - lastPoint.x, 2) +
                        Math.pow(percentageCoords.y - lastPoint.y, 2),
                    );
                    if (distanceInPercent >= 0.1)
                      return [...prev, percentageCoords];
                    return prev;
                  });
                }
                return;
              }
              const target = e.target;
              if (
                target &&
                target.name() === "background-image" &&
                !selectedShapeTool &&
                !isDrawingShape
              ) {
                onDeselect?.();
              }
              if (onImageClick) {
                const pointerPos = e.target.getStage()?.getPointerPosition();
                if (pointerPos) {
                  const percentageCoords = pointerToPercentage(
                    pointerPos.x,
                    pointerPos.y,
                  );
                  onImageClick(e, percentageCoords);
                } else {
                  onImageClick(e);
                }
              }
            }}
            onDblClick={(e) => {
              if (
                selectedShapeTool === PlacementShapeType.FREEFORM &&
                freeformPath.length >= 2 &&
                onShapeDraw
              ) {
                e.cancelBubble = true;
                const finalPath = [...freeformPath, freeformPath[0]];
                const sumX = finalPath.reduce((sum, p) => sum + p.x, 0);
                const sumY = finalPath.reduce((sum, p) => sum + p.y, 0);
                const cx = sumX / finalPath.length;
                const cy = sumY / finalPath.length;
                const points: number[] = [];
                finalPath.forEach((point) => {
                  points.push(point.x - cx, point.y - cy);
                });
                const shape: PlacementShape = {
                  type: PlacementShapeType.FREEFORM,
                  points,
                };
                onShapeDraw(shape, cx, cy);
                setFreeformPath([]);
                setFreeformHoverPos(null);
              }
            }}
            onTap={(e) => {
              const target = e.target;
              if (
                target &&
                target.name() === "background-image" &&
                !selectedShapeTool &&
                !isDrawingShape
              ) {
                onDeselect?.();
              }
            }}
          />
        )}
      </Layer>

      {/* Static Layer: Non-selected, non-dragged - redraws only on selection/drag-end */}
      <Layer {...layerTransform} listening={true}>
        {staticSeats.map((seat) => {
          const pos =
            seat.id === draggedSeatId && dragPosition
              ? dragPosition
              : { x: seat.x, y: seat.y };
          const { x, y } = percentageToStage(pos.x, pos.y);
          const colors = getSeatMarkerColors(seat);
          return (
            <MemoizedSeatMarkerCanvas
              key={seat.id}
              seat={seat}
              x={x}
              y={y}
              isSelected={selectedSeatIdSet.has(seat.id)}
              isAnchor={
                anchorSeatId === seat.id &&
                selectedSeatIdsProp &&
                selectedSeatIdsProp.length > 1
              }
              isPlacingSeats={isPlacingSeats}
              isPanning={isPanning}
              isSpacePressed={isSpacePressed}
              isPlacingSections={isPlacingSections}
              selectedShapeTool={selectedShapeTool}
              onSeatClick={onSeatClick}
              onSeatDragStart={handleSeatDragStart}
              onSeatDragMove={handleSeatDragMove}
              onSeatDragEnd={handleSeatDragEnd}
              onShapeTransform={onSeatShapeTransform}
              layerToPercentage={layerToPercentage}
              colors={colors}
              imageWidth={displayedWidth}
              imageHeight={displayedHeight}
              readOnly={readOnly}
              disableHoverAnimation={disableHoverAnimation}
              useLowDetail={useLowDetail}
            />
          );
        })}
        {venueType === "large" &&
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
                x={x}
                y={y}
                isSelected={selectedSectionIdSet.has(section.id)}
                isAnchor={
                  anchorSectionId === section.id &&
                  selectedSectionIdsProp &&
                  selectedSectionIdsProp.length > 1
                }
                isPlacingSections={isPlacingSections}
                isPanning={isPanning}
                isSpacePressed={isSpacePressed}
                isPlacingSeats={isPlacingSeats}
                onSectionClick={onSectionClick}
                onSectionDoubleClick={onSectionDoubleClick}
                onSectionDragEnd={handleSectionDragEnd}
                onSectionDragMove={handleSectionDragMove}
                onSectionDragStart={handleSectionDragStart}
                selectedShapeTool={selectedShapeTool}
                onShapeTransform={onSectionShapeTransform}
                layerToPercentage={layerToPercentage}
                colors={getSectionMarkerColors(section)}
                imageWidth={displayedWidth}
                imageHeight={displayedHeight}
                readOnly={readOnly}
                disableHoverAnimation={disableHoverAnimation}
                useLowDetail={useLowDetail}
              />
            );
          })}
        {visibleShapeOverlays.map((overlay) => {
          const isSelected = selectedOverlayId === overlay.id;
          return (
            <MemoizedShapeOverlayCanvas
              key={overlay.id}
              overlay={overlay}
              isSelected={isSelected}
              onShapeOverlayClick={onShapeOverlayClick}
              imageWidth={displayedWidth}
              imageHeight={displayedHeight}
              isPanning={isPanning}
              isSpacePressed={isSpacePressed}
              selectedShapeTool={selectedShapeTool}
              isPlacingSeats={isPlacingSeats}
              isPlacingSections={isPlacingSections}
              percentageToStage={percentageToStage}
              disableHoverAnimation={disableHoverAnimation}
            />
          );
        })}
      </Layer>

      {/* Interactive Layer: All selected seats/sections + Transformers; each shows its own box, redraw during transform for real-time visualization */}
      <Layer {...layerTransform} listening={true}>
        {selectedSeats.map((seat) => {
          const pos =
            seat.id === draggedSeatId && dragPosition
              ? dragPosition
              : { x: seat.x, y: seat.y };
          const { x, y } = percentageToStage(pos.x, pos.y);
          const colors = getSeatMarkerColors(seat);
          return (
            <MemoizedSeatMarkerCanvas
              key={seat.id}
              seat={seat}
              x={x}
              y={y}
              isSelected={true}
              isAnchor={
                anchorSeatId === seat.id &&
                selectedSeatIdsProp &&
                selectedSeatIdsProp.length > 1
              }
              isPlacingSeats={isPlacingSeats}
              isPanning={isPanning}
              isSpacePressed={isSpacePressed}
              isPlacingSections={isPlacingSections}
              selectedShapeTool={selectedShapeTool}
              onSeatClick={onSeatClick}
              onSeatDragStart={handleSeatDragStart}
              onSeatDragMove={handleSeatDragMove}
              onSeatDragEnd={handleSeatDragEnd}
              onShapeTransform={onSeatShapeTransform}
              layerToPercentage={layerToPercentage}
              colors={colors}
              imageWidth={displayedWidth}
              imageHeight={displayedHeight}
              readOnly={readOnly}
              disableHoverAnimation={disableHoverAnimation}
              useLowDetail={false}
              onTransformProgress={handleTransformProgress}
            />
          );
        })}
        {venueType === "large" &&
          selectedSections.map((section) => {
            const pos =
              section.id === draggedSectionId && dragPosition
                ? dragPosition
                : { x: section.x, y: section.y };
            const { x, y } = percentageToStage(pos.x, pos.y);
            return (
              <MemoizedSectionMarkerCanvas
                key={section.id}
                section={section}
                x={x}
                y={y}
                isSelected={true}
                isAnchor={
                  anchorSectionId === section.id &&
                  selectedSectionIdsProp &&
                  selectedSectionIdsProp.length > 1
                }
                isPlacingSections={isPlacingSections}
                isPanning={isPanning}
                isSpacePressed={isSpacePressed}
                isPlacingSeats={isPlacingSeats}
                onSectionClick={onSectionClick}
                onSectionDoubleClick={onSectionDoubleClick}
                onSectionDragEnd={handleSectionDragEnd}
                onSectionDragMove={handleSectionDragMove}
                onSectionDragStart={handleSectionDragStart}
                selectedShapeTool={selectedShapeTool}
                onShapeTransform={onSectionShapeTransform}
                layerToPercentage={layerToPercentage}
                colors={getSectionMarkerColors(section)}
                imageWidth={displayedWidth}
                imageHeight={displayedHeight}
                readOnly={readOnly}
                disableHoverAnimation={disableHoverAnimation}
                useLowDetail={false}
                onTransformProgress={handleTransformProgress}
              />
            );
          })}
        {/* Dragged shape when not in selection (e.g. mid-drag before select-on-drop) */}
        {draggedSeat &&
          draggedSeatId &&
          !selectedSeatIdSet.has(draggedSeatId) &&
          (() => {
            const pos = dragPosition ?? { x: draggedSeat.x, y: draggedSeat.y };
            const { x, y } = percentageToStage(pos.x, pos.y);
            const colors = getSeatMarkerColors(draggedSeat);
            return (
              <MemoizedSeatMarkerCanvas
                key={draggedSeat.id}
                seat={draggedSeat}
                x={x}
                y={y}
                isSelected={false}
                isAnchor={
                  anchorSeatId === draggedSeat.id &&
                  selectedSeatIdsProp &&
                  selectedSeatIdsProp.length > 1
                }
                isPlacingSeats={isPlacingSeats}
                isPanning={isPanning}
                isSpacePressed={isSpacePressed}
                isPlacingSections={isPlacingSections}
                selectedShapeTool={selectedShapeTool}
                onSeatClick={onSeatClick}
                onSeatDragStart={handleSeatDragStart}
                onSeatDragMove={handleSeatDragMove}
                onSeatDragEnd={handleSeatDragEnd}
                onShapeTransform={onSeatShapeTransform}
                colors={colors}
                imageWidth={displayedWidth}
                imageHeight={displayedHeight}
                readOnly={readOnly}
                disableHoverAnimation={disableHoverAnimation}
                useLowDetail={false}
                forceDraggable={true}
              />
            );
          })()}
        {venueType === "large" &&
          draggedSection &&
          draggedSectionId &&
          !selectedSectionIdSet.has(draggedSectionId) &&
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
                x={x}
                y={y}
                isSelected={false}
                isAnchor={
                  anchorSectionId === draggedSection.id &&
                  selectedSectionIdsProp &&
                  selectedSectionIdsProp.length > 1
                }
                isPlacingSections={isPlacingSections}
                isPanning={isPanning}
                isSpacePressed={isSpacePressed}
                isPlacingSeats={isPlacingSeats}
                onSectionClick={onSectionClick}
                onSectionDoubleClick={onSectionDoubleClick}
                onSectionDragEnd={handleSectionDragEnd}
                onSectionDragMove={handleSectionDragMove}
                onSectionDragStart={handleSectionDragStart}
                selectedShapeTool={selectedShapeTool}
                onShapeTransform={onSectionShapeTransform}
                layerToPercentage={layerToPercentage}
                colors={getSectionMarkerColors(draggedSection)}
                imageWidth={displayedWidth}
                imageHeight={displayedHeight}
                readOnly={readOnly}
                disableHoverAnimation={disableHoverAnimation}
                useLowDetail={false}
                forceDraggable={true}
              />
            );
          })()}
      </Layer>

      {/* Overlay Layer: Preview shapes, freeform lines, etc. */}
      <Layer
        {...layerTransform}
        listening={true}
        onClick={(e) => {
          // Handle polygon/freeform click-to-add-points at Layer level
          // This ensures clicks work even when seats/sections are on top
          if (
            selectedShapeTool === PlacementShapeType.FREEFORM &&
            onShapeDraw
          ) {
            // Only handle if clicking on the layer itself (not on a marker)
            const target = e.target;
            // If clicking on a marker, let it handle the click
            if (
              target &&
              (target.name() === "seat-marker" ||
                target.name() === "section-marker")
            ) {
              return;
            }

            e.cancelBubble = true;
            const pointerPos = e.target.getStage()?.getPointerPosition();
            if (pointerPos) {
              const percentageCoords = pointerToPercentage(
                pointerPos.x,
                pointerPos.y,
              );

              // Check if clicking near the first point to close the shape (need at least 2 points)
              if (freeformPath.length >= 2) {
                const firstPoint = freeformPath[0];
                const distanceToStart = Math.sqrt(
                  Math.pow(percentageCoords.x - firstPoint.x, 2) +
                    Math.pow(percentageCoords.y - firstPoint.y, 2),
                );

                // If clicking within 1.5% of the start point, close the shape
                if (distanceToStart < 1.5) {
                  // Complete the shape by closing to the first point
                  const finalPath = [...freeformPath, firstPoint]; // Add first point at end to close
                  const sumX = finalPath.reduce((sum, p) => sum + p.x, 0);
                  const sumY = finalPath.reduce((sum, p) => sum + p.y, 0);
                  const centerX = sumX / finalPath.length;
                  const centerY = sumY / finalPath.length;

                  const points: number[] = [];
                  finalPath.forEach((point) => {
                    points.push(point.x - centerX, point.y - centerY);
                  });

                  const shape: PlacementShape = {
                    type: PlacementShapeType.FREEFORM,
                    points,
                  };
                  onShapeDraw(shape, centerX, centerY);

                  // Reset freeform path and hover position
                  setFreeformPath([]);
                  setFreeformHoverPos(null);
                  return;
                }
              }

              // Add new point to the path
              setFreeformPath((prev) => {
                if (prev.length === 0) {
                  return [percentageCoords];
                }
                const lastPoint = prev[prev.length - 1];

                // Calculate distance in percentage for threshold checking
                // This works consistently regardless of zoom level or image size
                const distanceInPercent = Math.sqrt(
                  Math.pow(percentageCoords.x - lastPoint.x, 2) +
                    Math.pow(percentageCoords.y - lastPoint.y, 2),
                );

                // Use a percentage-based threshold (0.1%) to prevent exact duplicate clicks
                // This allows adding points very close together for tight shapes like rectangles/polygons
                // and works consistently in all directions and at all zoom levels
                if (distanceInPercent >= 0.1) {
                  return [...prev, percentageCoords];
                }
                return prev;
              });
            }
          }
        }}
      >
        {/* Hit area for freeform - passes through to lower layers for seat clicks */}
        <Rect
          x={imageX}
          y={imageY}
          width={displayedWidth}
          height={displayedHeight}
          fill="transparent"
          listening={false}
          onMouseMove={(e) => {
            // Track hover position for freeform preview
            if (
              selectedShapeTool === PlacementShapeType.FREEFORM &&
              freeformPath.length > 0
            ) {
              const pointerPos = e.target.getStage()?.getPointerPosition();
              if (pointerPos) {
                const percentageCoords = pointerToPercentage(
                  pointerPos.x,
                  pointerPos.y,
                );
                setFreeformHoverPos(percentageCoords);
              }
            }
          }}
          onClick={(e) => {
            // Check if we should ignore this click (e.g. after drag-to-draw)
            if (ignoreClickRef.current) {
              ignoreClickRef.current = false;
              return;
            }

            // Handle freeform click-to-add-points
            if (
              selectedShapeTool === PlacementShapeType.FREEFORM &&
              onShapeDraw
            ) {
              e.cancelBubble = true;
              const pointerPos = e.target.getStage()?.getPointerPosition();
              if (pointerPos) {
                const percentageCoords = pointerToPercentage(
                  pointerPos.x,
                  pointerPos.y,
                );

                // Check if clicking near the first point to close the shape (need at least 2 points)
                if (freeformPath.length >= 2) {
                  const firstPoint = freeformPath[0];
                  const distanceToStart = Math.sqrt(
                    Math.pow(percentageCoords.x - firstPoint.x, 2) +
                      Math.pow(percentageCoords.y - firstPoint.y, 2),
                  );

                  // If clicking within 1.5% of the start point, close the shape
                  if (distanceToStart < 1.5) {
                    // Complete the shape by closing to the first point
                    const finalPath = [...freeformPath, firstPoint]; // Add first point at end to close
                    const sumX = finalPath.reduce((sum, p) => sum + p.x, 0);
                    const sumY = finalPath.reduce((sum, p) => sum + p.y, 0);
                    const centerX = sumX / finalPath.length;
                    const centerY = sumY / finalPath.length;

                    const points: number[] = [];
                    finalPath.forEach((point) => {
                      points.push(point.x - centerX, point.y - centerY);
                    });

                    const shape: PlacementShape = {
                      type: PlacementShapeType.FREEFORM,
                      points,
                    };
                    onShapeDraw(shape, centerX, centerY);

                    // Reset freeform path and hover position
                    setFreeformPath([]);
                    setFreeformHoverPos(null);
                    return;
                  }
                }

                // Add new point to the path
                setFreeformPath((prev) => {
                  if (prev.length === 0) {
                    return [percentageCoords];
                  }
                  const lastPoint = prev[prev.length - 1];

                  // Calculate distance in percentage for threshold checking
                  // This works consistently regardless of zoom level or image size
                  const distanceInPercent = Math.sqrt(
                    Math.pow(percentageCoords.x - lastPoint.x, 2) +
                      Math.pow(percentageCoords.y - lastPoint.y, 2),
                  );

                  // Use a percentage-based threshold (0.1%) to prevent exact duplicate clicks
                  // This allows adding points very close together for tight shapes like rectangles/polygons
                  // and works consistently in all directions and at all zoom levels
                  if (distanceInPercent >= 0.1) {
                    return [...prev, percentageCoords];
                  }
                  return prev;
                });
              }
              return;
            }

            // Only deselect if clicking directly on the image (not on a marker)
            // Markers use e.cancelBubble = true to prevent this from firing
            // Also don't deselect if we're drawing a shape or if a shape tool is selected
            const target = e.target;
            if (
              target &&
              target.name() === "background-image" &&
              !selectedShapeTool &&
              !isDrawingShape
            ) {
              onDeselect?.();
            }
            // Also call onImageClick if provided
            if (onImageClick) {
              const pointerPos = e.target.getStage()?.getPointerPosition();
              if (pointerPos) {
                const percentageCoords = pointerToPercentage(
                  pointerPos.x,
                  pointerPos.y,
                );
                onImageClick(e, percentageCoords);
              } else {
                onImageClick(e);
              }
            }
          }}
          onDblClick={(e) => {
            // Double-click to complete freeform shape by closing to the initial point
            if (
              selectedShapeTool === PlacementShapeType.FREEFORM &&
              freeformPath.length >= 2 &&
              onShapeDraw
            ) {
              e.cancelBubble = true;
              // Close the shape by adding the first point at the end
              const finalPath = [...freeformPath, freeformPath[0]]; // Add first point at end to close
              const sumX = finalPath.reduce((sum, p) => sum + p.x, 0);
              const sumY = finalPath.reduce((sum, p) => sum + p.y, 0);
              const centerX = sumX / finalPath.length;
              const centerY = sumY / finalPath.length;

              const points: number[] = [];
              finalPath.forEach((point) => {
                points.push(point.x - centerX, point.y - centerY);
              });

              const shape: PlacementShape = {
                type: PlacementShapeType.FREEFORM,
                points,
              };
              onShapeDraw(shape, centerX, centerY);

              // Reset freeform path and hover position
              setFreeformPath([]);
              setFreeformHoverPos(null);
            }
          }}
          onTap={(e) => {
            // Handle tap for mobile devices
            const target = e.target;
            if (
              target &&
              target.name() === "background-image" &&
              !selectedShapeTool &&
              !isDrawingShape
            ) {
              onDeselect?.();
            }
          }}
        />

        {/* Preview shape while drawing - show freeform preview when points exist */}
        {selectedShapeTool === PlacementShapeType.FREEFORM &&
          freeformPath.length > 0 &&
          (() => {
            // Show lines connecting clicked points (straight lines between consecutive points)
            // Plus a preview line from the last point to the cursor
            const lines: Array<{ points: number[]; x: number; y: number }> = [];

            // Draw lines between clicked points (straight lines)
            for (let i = 0; i < freeformPath.length - 1; i++) {
              const startPoint = freeformPath[i];
              const endPoint = freeformPath[i + 1];
              const { x: startX, y: startY } = percentageToStage(
                startPoint.x,
                startPoint.y,
              );
              const { x: endX, y: endY } = percentageToStage(
                endPoint.x,
                endPoint.y,
              );

              lines.push({
                points: [0, 0, endX - startX, endY - startY], // Relative to start point
                x: startX,
                y: startY,
              });
            }

            // Draw preview line from last clicked point to cursor (if hovering)
            if (freeformHoverPos && freeformPath.length > 0) {
              const lastPoint = freeformPath[freeformPath.length - 1];
              const { x: lastX, y: lastY } = percentageToStage(
                lastPoint.x,
                lastPoint.y,
              );
              const { x: hoverX, y: hoverY } = percentageToStage(
                freeformHoverPos.x,
                freeformHoverPos.y,
              );

              lines.push({
                points: [0, 0, hoverX - lastX, hoverY - lastY], // Relative to last point
                x: lastX,
                y: lastY,
              });
            }

            return (
              <>
                {lines.map((line, index) => (
                  <Line
                    key={`freeform-preview-${index}`}
                    points={line.points}
                    x={line.x}
                    y={line.y}
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    opacity={0.8}
                    dash={index === lines.length - 1 ? [5, 5] : undefined} // Dashed for preview line
                  />
                ))}
              </>
            );
          })()}

        {/* Preview shape while drawing - for other shape types */}
        {isDrawingShape &&
          drawStartPos &&
          selectedShapeTool &&
          selectedShapeTool !== PlacementShapeType.FREEFORM &&
          (() => {
            // Handle other shape types (drag to draw)
            if (drawCurrentPos) {
              const startX = drawStartPos.x;
              const startY = drawStartPos.y;
              const endX = drawCurrentPos.x;
              const endY = drawCurrentPos.y;

              const minSize = 1.5;
              const width = Math.max(minSize, Math.abs(endX - startX));
              const height = Math.max(minSize, Math.abs(endY - startY));

              const centerX = (startX + endX) / 2;
              const centerY = (startY + endY) / 2;

              const { x, y } = percentageToStage(centerX, centerY);

              let previewShape: PlacementShape;
              if (selectedShapeTool === PlacementShapeType.CIRCLE) {
                const radius = Math.max(width, height) / 2;
                previewShape = {
                  type: PlacementShapeType.CIRCLE,
                  radius: Math.max(0.8, radius),
                };
              } else if (selectedShapeTool === PlacementShapeType.RECTANGLE) {
                previewShape = {
                  type: PlacementShapeType.RECTANGLE,
                  width: Math.max(1.0, width),
                  height: Math.max(1.0, height),
                  cornerRadius: 2,
                };
              } else if (selectedShapeTool === PlacementShapeType.ELLIPSE) {
                previewShape = {
                  type: PlacementShapeType.ELLIPSE,
                  width: Math.max(1.0, width),
                  height: Math.max(1.0, height),
                };
              } else if (selectedShapeTool === PlacementShapeType.POLYGON) {
                // For polygon, use hexagon shape scaled to drag size
                // Base hexagon points (relative to center)
                const basePoints = [
                  -1, -1, 1, -1, 1.5, 0, 1, 1, -1, 1, -1.5, 0,
                ];
                // Scale points based on drag dimensions
                const scaleX = width / 2; // Divide by 2 because base points range from -1.5 to 1.5
                const scaleY = height / 2;
                const scaledPoints = basePoints.map((p, index) => {
                  if (index % 2 === 0) {
                    // x coordinate
                    return p * scaleX;
                  } else {
                    // y coordinate
                    return p * scaleY;
                  }
                });
                previewShape = {
                  type: PlacementShapeType.POLYGON,
                  points: scaledPoints,
                };
              } else if (selectedShapeTool === PlacementShapeType.SOFA) {
                previewShape = {
                  type: PlacementShapeType.SOFA,
                  width: Math.max(5, width),
                  height: Math.max(4, height),
                  fillColor: "#60a5fa",
                  strokeColor: "#2563eb",
                };
              } else if (selectedShapeTool === PlacementShapeType.STAGE) {
                previewShape = {
                  type: PlacementShapeType.STAGE,
                  width: Math.max(20, width),
                  height: Math.max(15, height),
                  fillColor: "#333333",
                  strokeColor: "#2563eb",
                };
              } else if (selectedShapeTool === PlacementShapeType.SEAT) {
                previewShape = {
                  type: PlacementShapeType.SEAT,
                  width: Math.max(1.0, width),
                  height: Math.max(1.0, height),
                };
              } else {
                // Fallback (shouldn't happen)
                previewShape = {
                  type: PlacementShapeType.POLYGON,
                  points: [-1, -1, 1, -1, 1.5, 0, 1, 1, -1, 1, -1.5, 0],
                };
              }

              return (
                <Group ref={previewShapeRef} x={x} y={y}>
                  <ShapeRenderer
                    shape={previewShape}
                    fill="rgba(59, 130, 246, 0.15)"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    imageWidth={displayedWidth}
                    imageHeight={displayedHeight}
                    opacity={0.8}
                  />
                </Group>
              );
            }

            return null;
          })()}
      </Layer>

      {/* Selection marquee (stage coordinates, on top) */}
      {selectionStart && selectionCurrent && (
        <Layer listening={false}>
          <Rect
            x={Math.min(selectionStart.x, selectionCurrent.x)}
            y={Math.min(selectionStart.y, selectionCurrent.y)}
            width={Math.abs(selectionCurrent.x - selectionStart.x)}
            height={Math.abs(selectionCurrent.y - selectionStart.y)}
            stroke={MARQUEE_STROKE}
            strokeWidth={1}
            dash={[6, 4]}
            fill={MARQUEE_FILL}
          />
        </Layer>
      )}
    </Stage>
  );
}
