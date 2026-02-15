/**
 * Callbacks for SeatLevelView and SectionLevelView.
 * Extracts inline handlers to improve readability of seat-designer.tsx.
 */

import { useCallback } from "react";
import Konva from "konva";
import type { PlacementShape } from "../types";
import { PlacementShapeType, SeatMarker, SectionMarker } from "../types";
import type {
  UseSeatLevelCallbacksProps,
  UseSectionLevelCallbacksProps,
} from "./seat-designer-view-callback-types";

/** Bounding box of a marker in percentage coordinates */
interface MarkerBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

export type AlignmentType =
  | "left"
  | "center"
  | "right"
  | "top"
  | "middle"
  | "bottom"
  | "space-between-h"
  | "space-between-v"
  | "space-between-both"
  | "same-width"
  | "same-height";

/** Compute bounding box for a seat or section marker (exported for SectionDetailView) */
export function getMarkerBounds(
  marker: { x: number; y: number; shape?: PlacementShape },
  defaults: { radius?: number; width?: number; height?: number },
): MarkerBounds {
  const { x, y } = marker;
  const shape = marker.shape;
  const type = shape?.type ?? PlacementShapeType.CIRCLE;

  if (type === PlacementShapeType.CIRCLE) {
    const radius = shape?.radius ?? defaults.radius ?? 0.8;
    return {
      left: x - radius,
      right: x + radius,
      top: y - radius,
      bottom: y + radius,
      centerX: x,
      centerY: y,
    };
  }

  if (
    type === PlacementShapeType.RECTANGLE ||
    type === PlacementShapeType.ELLIPSE ||
    type === PlacementShapeType.SEAT
  ) {
    const w = shape?.width ?? defaults.width ?? 2;
    const h = shape?.height ?? defaults.height ?? 1.5;
    const halfW = w / 2;
    const halfH = h / 2;
    return {
      left: x - halfW,
      right: x + halfW,
      top: y - halfH,
      bottom: y + halfH,
      centerX: x,
      centerY: y,
    };
  }

  const w = shape?.width ?? defaults.width ?? 0;
  const h = shape?.height ?? defaults.height ?? 0;
  const halfW = w / 2;
  const halfH = h / 2;
  return {
    left: x - halfW,
    right: x + halfW,
    top: y - halfH,
    bottom: y + halfH,
    centerX: x,
    centerY: y,
  };
}

/** Apply alignment to markers; returns updates per marker id (exported for SectionDetailView) */
export function applyAlignment<
  T extends { id: string; x: number; y: number; shape?: PlacementShape },
>(
  markers: T[],
  bounds: MarkerBounds[],
  alignment: AlignmentType,
  defaults: { radius?: number; width?: number; height?: number },
): Map<string, Partial<T>> {
  const updates = new Map<string, Partial<T>>();
  if (markers.length < 2) return updates;

  const minLeft = Math.min(...bounds.map((b) => b.left));
  const maxRight = Math.max(...bounds.map((b) => b.right));
  const minTop = Math.min(...bounds.map((b) => b.top));
  const maxBottom = Math.max(...bounds.map((b) => b.bottom));
  const targetCenterX = (minLeft + maxRight) / 2;
  const targetCenterY = (minTop + maxBottom) / 2;

  if (
    alignment === "space-between-h" ||
    alignment === "space-between-v" ||
    alignment === "space-between-both" ||
    alignment === "same-width" ||
    alignment === "same-height"
  ) {
    const runSpaceBetweenH = () => {
      const sorted = markers
        .map((m, i) => ({ marker: m, bounds: bounds[i], idx: i }))
        .sort((a, b) => a.bounds.centerX - b.bounds.centerX);
      const n = sorted.length;
      const leftmostLeft = sorted[0].bounds.left;
      const rightmostRight = sorted[n - 1].bounds.right;
      const totalSpan = rightmostRight - leftmostLeft;
      const widths = sorted.map((s) => s.bounds.right - s.bounds.left);
      const totalWidth = widths.reduce((sum, w) => sum + w, 0);
      const totalGap = Math.max(0, totalSpan - totalWidth);
      const gap = n > 1 ? totalGap / (n - 1) : 0;
      let runningLeft = leftmostLeft;
      sorted.forEach(({ marker }, i) => {
        const w = widths[i];
        const newCenterX = runningLeft + w / 2;
        updates.set(marker.id, {
          ...updates.get(marker.id),
          x: newCenterX,
        } as Partial<T>);
        runningLeft += w + gap;
      });
    };
    const runSpaceBetweenV = () => {
      const sorted = markers
        .map((m, i) => ({ marker: m, bounds: bounds[i], idx: i }))
        .sort((a, b) => a.bounds.centerY - b.bounds.centerY);
      const n = sorted.length;
      const topmostTop = sorted[0].bounds.top;
      const bottommostBottom = sorted[n - 1].bounds.bottom;
      const totalSpan = bottommostBottom - topmostTop;
      const heights = sorted.map((s) => s.bounds.bottom - s.bounds.top);
      const totalHeight = heights.reduce((sum, h) => sum + h, 0);
      const totalGap = Math.max(0, totalSpan - totalHeight);
      const gap = n > 1 ? totalGap / (n - 1) : 0;
      let runningTop = topmostTop;
      sorted.forEach(({ marker }, i) => {
        const h = heights[i];
        const newCenterY = runningTop + h / 2;
        updates.set(marker.id, {
          ...updates.get(marker.id),
          y: newCenterY,
        } as Partial<T>);
        runningTop += h + gap;
      });
    };
    if (alignment === "space-between-h") runSpaceBetweenH();
    else if (alignment === "space-between-v") runSpaceBetweenV();
    else if (alignment === "space-between-both") {
      runSpaceBetweenH();
      runSpaceBetweenV();
    } else if (alignment === "same-width") {
      let maxW = 0;
      markers.forEach((m, i) => {
        const b = bounds[i];
        const w = b.right - b.left;
        if (w > maxW) maxW = w;
      });
      markers.forEach((marker) => {
        const shape = marker.shape ?? ({} as PlacementShape);
        const type = shape.type ?? PlacementShapeType.CIRCLE;
        if (type === PlacementShapeType.CIRCLE) {
          updates.set(marker.id, {
            shape: { ...shape, type, radius: maxW / 2 } as PlacementShape,
          } as Partial<T>);
        } else if (
          type === PlacementShapeType.RECTANGLE ||
          type === PlacementShapeType.ELLIPSE ||
          type === PlacementShapeType.SEAT
        ) {
          updates.set(marker.id, {
            shape: { ...shape, type, width: maxW } as PlacementShape,
          } as Partial<T>);
        }
      });
    } else if (alignment === "same-height") {
      let maxH = 0;
      markers.forEach((m, i) => {
        const b = bounds[i];
        const h = b.bottom - b.top;
        if (h > maxH) maxH = h;
      });
      markers.forEach((marker) => {
        const shape = marker.shape ?? ({} as PlacementShape);
        const type = shape.type ?? PlacementShapeType.CIRCLE;
        if (type === PlacementShapeType.CIRCLE) {
          updates.set(marker.id, {
            shape: { ...shape, type, radius: maxH / 2 } as PlacementShape,
          } as Partial<T>);
        } else if (
          type === PlacementShapeType.RECTANGLE ||
          type === PlacementShapeType.ELLIPSE ||
          type === PlacementShapeType.SEAT
        ) {
          updates.set(marker.id, {
            shape: { ...shape, type, height: maxH } as PlacementShape,
          } as Partial<T>);
        }
      });
    }
    return updates;
  }

  markers.forEach((marker, i) => {
    const b = bounds[i];
    const u: Partial<T> = {};
    if (
      alignment === "left" ||
      alignment === "center" ||
      alignment === "right"
    ) {
      if (alignment === "left") u.x = marker.x + (minLeft - b.left);
      else if (alignment === "right") u.x = marker.x + (maxRight - b.right);
      else u.x = targetCenterX;
    }
    if (
      alignment === "top" ||
      alignment === "middle" ||
      alignment === "bottom"
    ) {
      if (alignment === "top") u.y = marker.y + (minTop - b.top);
      else if (alignment === "bottom") u.y = marker.y + (maxBottom - b.bottom);
      else u.y = targetCenterY;
    }
    if (Object.keys(u).length > 0) updates.set(marker.id, u);
  });
  return updates;
}

/** Shape style for seat/section updates */
interface ShapeStyle {
  fillColor?: string;
  strokeColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
}

export type { UseSeatLevelCallbacksProps, UseSectionLevelCallbacksProps } from "./seat-designer-view-callback-types";

export function useSeatLevelCallbacks({
  recordSnapshot,
  setSeats,
  setSectionMarkers,
  setEditingSectionId,
  setIsSectionCreationPending,
  setPlacementShape,
  setSelectedShapeTool,
  setSelectedOverlayId,
  setZoomLevel,
  setSelectedSeatIds,
  setSelectedSectionIds,
  seats,
  sectionMarkers,
  selectedSeatIds,
  selectedSectionIds,
  selectedShapeTool,
  handleSeatClickWithToolSwitch,
  handleKonvaSeatDragEnd,
  handleBatchSeatDragEnd,
  handleSeatShapeTransform,
  handleKonvaImageClick,
  handleDeselect,
  handleShapeDraw,
  handleResetZoomAndPan,
  handleZoomIn,
  handleZoomOut,
  handlePanDelta,
}: UseSeatLevelCallbacksProps) {
  const onSectionEdit = useCallback(
    (section: SectionMarker) => {
      setEditingSectionId(section.id);
      setIsSectionCreationPending(true);
      if (section.shape) {
        setPlacementShape(section.shape);
        setSelectedShapeTool(section.shape.type);
      }
    },
    [
      setEditingSectionId,
      setIsSectionCreationPending,
      setPlacementShape,
      setSelectedShapeTool,
    ],
  );

  const onSeatShapeStyleChange = useCallback(
    (seatId: string, style: ShapeStyle) => {
      recordSnapshot();
      setSeats((prev) =>
        prev.map((s) =>
          s.id === seatId
            ? {
              ...s,
              shape: {
                ...(s.shape || {
                  type: PlacementShapeType.CIRCLE,
                  radius: 0.8,
                }),
                ...style,
              } as PlacementShape,
            }
            : s,
        ),
      );
    },
    [recordSnapshot, setSeats],
  );

  const onSectionShapeStyleChange = useCallback(
    (sectionId: string, style: ShapeStyle) => {
      recordSnapshot();
      setSectionMarkers((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? {
              ...s,
              shape: {
                ...(s.shape || {
                  type: PlacementShapeType.RECTANGLE,
                  width: 2,
                  height: 1.5,
                }),
                ...style,
              } as PlacementShape,
            }
            : s,
        ),
      );
    },
    [recordSnapshot, setSectionMarkers],
  );

  const onAlign = useCallback(
    (alignment: string) => {
      recordSnapshot();
      const align = alignment as AlignmentType;
      if (selectedSeatIds.length > 1) {
        const selectedSeats = seats.filter((s) =>
          selectedSeatIds.includes(s.id),
        );
        const bounds = selectedSeats.map((s) =>
          getMarkerBounds(s, { radius: 0.8 }),
        );
        const updatesMap = applyAlignment(
          selectedSeats,
          bounds,
          align,
          { radius: 0.8 },
        );
        setSeats((prev) =>
          prev.map((seat) => {
            const u = updatesMap.get(seat.id);
            if (!u) return seat;
            return { ...seat, ...u };
          }),
        );
      }
      if (selectedSectionIds.length > 1) {
        const selectedSections = sectionMarkers.filter((s) =>
          selectedSectionIds.includes(s.id),
        );
        const bounds = selectedSections.map((s) =>
          getMarkerBounds(s, { width: 2, height: 1.5 }),
        );
        const updatesMap = applyAlignment(
          selectedSections,
          bounds,
          align,
          { width: 2, height: 1.5 },
        );
        setSectionMarkers((prev) =>
          prev.map((section) => {
            const u = updatesMap.get(section.id);
            if (!u) return section;
            return { ...section, ...u };
          }),
        );
      }
    },
    [
      recordSnapshot,
      selectedSeatIds,
      selectedSectionIds,
      seats,
      sectionMarkers,
      setSeats,
      setSectionMarkers,
    ],
  );

  const onShapeOverlayClick = useCallback(
    (id: string) => {
      if (selectedShapeTool) setSelectedShapeTool(null);
      setSelectedOverlayId(id);
    },
    [selectedShapeTool, setSelectedShapeTool, setSelectedOverlayId],
  );

  const onWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>, isSpace: boolean) => {
      if (isSpace) {
        e.evt.preventDefault();
        const delta = e.evt.deltaY > 0 ? -0.1 : 0.1;
        setZoomLevel((prev) =>
          Math.max(0.5, Math.min(3, prev + delta)),
        );
      }
    },
    [setZoomLevel],
  );

  const onMarkersInRect = useCallback(
    (seatIds: string[], sectionIds: string[]) => {
      if (selectedShapeTool) return;
      setSelectedSeatIds(seatIds);
      setSelectedSectionIds(sectionIds);
    },
    [
      selectedShapeTool,
      setSelectedSeatIds,
      setSelectedSectionIds,
    ],
  );

  return {
    onSectionEdit,
    onSeatShapeStyleChange,
    onSectionShapeStyleChange,
    onAlign,
    onShapeOverlayClick,
    onWheel,
    onMarkersInRect,
    handleSeatClickWithToolSwitch,
    handleKonvaSeatDragEnd,
    handleBatchSeatDragEnd,
    handleSeatShapeTransform,
    handleKonvaImageClick,
    handleDeselect,
    handleShapeDraw,
    handleResetZoomAndPan,
    handleZoomIn,
    handleZoomOut,
    handlePanDelta,
  };
}

export function useSectionLevelCallbacks({
  recordSnapshot,
  setSectionMarkers,
  setSelectedShapeTool,
  setSelectedOverlayId,
  setZoomLevel,
  setSelectedSectionIds,
  sectionMarkers,
  selectedSectionIds,
  selectedShapeTool,
  handleSeatClickWithToolSwitch,
  handleSectionClickWithToolSwitch,
  handleKonvaSectionDragEnd,
  handleKonvaSeatDragEnd,
  handleBatchSeatDragEnd,
  handleBatchSectionDragEnd,
  handleSeatShapeTransform,
  handleSectionShapeTransform,
  handleKonvaImageClick,
  handleDeselect,
  handleShapeDraw,
  handleResetZoomAndPan,
  handleZoomIn,
  handleZoomOut,
  handlePanDelta,
}: UseSectionLevelCallbacksProps) {
  const onSectionShapeStyleChange = useCallback(
    (id: string, style: ShapeStyle) => {
      recordSnapshot();
      setSectionMarkers((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
              ...s,
              shape: {
                ...(s.shape || {
                  type: PlacementShapeType.RECTANGLE,
                  width: 2,
                  height: 1.5,
                }),
                ...style,
              } as PlacementShape,
            }
            : s,
        ),
      );
    },
    [recordSnapshot, setSectionMarkers],
  );

  const onAlign = useCallback(
    (alignment: string) => {
      if (selectedSectionIds.length <= 1) return;
      recordSnapshot();
      const selectedSectionsList = sectionMarkers.filter((s) =>
        selectedSectionIds.includes(s.id),
      );
      const bounds = selectedSectionsList.map((s) =>
        getMarkerBounds(s, { width: 2, height: 1.5 }),
      );
      const updatesMap = applyAlignment(
        selectedSectionsList,
        bounds,
        alignment as AlignmentType,
        { width: 2, height: 1.5 },
      );
      setSectionMarkers((prev) =>
        prev.map((section) => {
          const u = updatesMap.get(section.id);
          if (!u) return section;
          return { ...section, ...u };
        }),
      );
    },
    [
      recordSnapshot,
      selectedSectionIds,
      sectionMarkers,
      setSectionMarkers,
    ],
  );

  const onShapeOverlayClick = useCallback(
    (id: string) => {
      if (selectedShapeTool) setSelectedShapeTool(null);
      setSelectedOverlayId(id);
    },
    [selectedShapeTool, setSelectedShapeTool, setSelectedOverlayId],
  );

  const onWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>, isSpace: boolean) => {
      if (isSpace) {
        e.evt.preventDefault();
        const delta = e.evt.deltaY > 0 ? -0.1 : 0.1;
        setZoomLevel((prev) =>
          Math.max(0.5, Math.min(3, prev + delta)),
        );
      }
    },
    [setZoomLevel],
  );

  const onMarkersInRect = useCallback(
    (_seatIds: string[], sectionIds: string[]) => {
      if (selectedShapeTool) return;
      setSelectedSectionIds(sectionIds);
    },
    [selectedShapeTool, setSelectedSectionIds],
  );

  return {
    onSectionShapeStyleChange,
    onAlign,
    onShapeOverlayClick,
    onWheel,
    onMarkersInRect,
    handleSeatClickWithToolSwitch,
    handleSectionClickWithToolSwitch,
    handleKonvaSectionDragEnd,
    handleKonvaSeatDragEnd,
    handleBatchSeatDragEnd,
    handleBatchSectionDragEnd,
    handleSeatShapeTransform,
    handleSectionShapeTransform,
    handleKonvaImageClick,
    handleDeselect,
    handleShapeDraw,
    handleResetZoomAndPan,
    handleZoomIn,
    handleZoomOut,
    handlePanDelta,
  };
}
