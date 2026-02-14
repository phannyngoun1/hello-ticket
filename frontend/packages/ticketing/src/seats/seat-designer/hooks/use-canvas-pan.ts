/**
 * Canvas pan state and Space+drag panning.
 * Provides pan offset state, Space key handling, and mouse event handlers.
 */

import { useState, useCallback, useEffect } from "react";
import type Konva from "konva";

export interface UseCanvasPanOptions {
  /** Called when pan delta is applied (for resetting pan with zoom) */
  onPanChange?: (offset: { x: number; y: number }) => void;
}

export interface UseCanvasPanReturn {
  panOffset: { x: number; y: number };
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  isSpacePressed: boolean;
  isPanning: boolean;
  panStartPos: { x: number; y: number } | null;
  handleMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
  /** Call to apply pan delta (e.g. from parent) */
  handlePanDelta: (delta: { x: number; y: number }) => void;
  /** Reset pan (e.g. when resetting zoom) */
  resetPan: () => void;
}

export function useCanvasPan(
  _options: UseCanvasPanOptions = {},
): UseCanvasPanReturn {
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPos, setPanStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Handle Space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        !!target.closest("input, textarea, [contenteditable]");

      if (e.code === "Space" && !e.repeat && !isInputField) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        !!target.closest("input, textarea, [contenteditable]");

      if (e.code === "Space" && !isInputField) {
        e.preventDefault();
        setIsSpacePressed(false);
        if (isPanning) {
          setIsPanning(false);
          setPanStartPos(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPanning]);

  const handlePanDelta = useCallback((delta: { x: number; y: number }) => {
    setPanOffset((prev) => ({
      x: prev.x + delta.x,
      y: prev.y + delta.y,
    }));
  }, []);

  const resetPan = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      if (isSpacePressed) {
        setIsPanning(true);
        setPanStartPos(pointerPos);
      }
    },
    [isSpacePressed],
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isPanning && isSpacePressed && panStartPos) {
        const stage = e.target.getStage();
        if (!stage) return;

        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;

        const delta = {
          x: pointerPos.x - panStartPos.x,
          y: pointerPos.y - panStartPos.y,
        };

        setPanStartPos(pointerPos);
        setPanOffset((prev) => ({
          x: prev.x + delta.x,
          y: prev.y + delta.y,
        }));
      }
    },
    [isPanning, isSpacePressed, panStartPos],
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setPanStartPos(null);
    }
  }, [isPanning]);

  const handleMouseLeave = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setPanStartPos(null);
    }
  }, [isPanning]);

  return {
    panOffset,
    setPanOffset,
    isSpacePressed,
    isPanning,
    panStartPos,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handlePanDelta,
    resetPan,
  };
}
