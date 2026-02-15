/**
 * Canvas zoom state and handlers.
 * Supports button controls (zoom in/out/reset) with configurable min/max.
 * Use step for additive zoom (designer) or zoomFactor for multiplicative (inventory viewer).
 */

import { useState, useCallback } from "react";

export interface UseCanvasZoomOptions {
  /** Minimum zoom level (default: 0.5) */
  minZoom?: number;
  /** Maximum zoom level (default: 3) */
  maxZoom?: number;
  /** Step for zoom in/out buttons - additive (default: 0.25). Ignored if zoomFactor is set. */
  step?: number;
  /** Multiplicative factor for zoom in/out (e.g. 1.2). Overrides step when set. */
  zoomFactor?: number;
  /** Initial zoom level (default: 1) */
  initialZoom?: number;
}

const DEFAULT_OPTIONS = {
  minZoom: 0.5,
  maxZoom: 3,
  step: 0.25,
  zoomFactor: undefined as number | undefined,
  initialZoom: 1,
};

export function useCanvasZoom(options: UseCanvasZoomOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [zoomLevel, setZoomLevel] = useState(opts.initialZoom);

  const handleZoomIn = useCallback(() => {
    if (opts.zoomFactor !== undefined) {
      setZoomLevel((prev) => Math.min(prev * opts.zoomFactor!, opts.maxZoom));
    } else {
      setZoomLevel((prev) => Math.min(prev + opts.step, opts.maxZoom));
    }
  }, [opts.step, opts.zoomFactor, opts.maxZoom]);

  const handleZoomOut = useCallback(() => {
    if (opts.zoomFactor !== undefined) {
      setZoomLevel((prev) => Math.max(prev / opts.zoomFactor!, opts.minZoom));
    } else {
      setZoomLevel((prev) => Math.max(prev - opts.step, opts.minZoom));
    }
  }, [opts.step, opts.zoomFactor, opts.minZoom]);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(opts.initialZoom);
  }, [opts.initialZoom]);

  return {
    zoomLevel,
    setZoomLevel,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    minZoom: opts.minZoom,
    maxZoom: opts.maxZoom,
  };
}
