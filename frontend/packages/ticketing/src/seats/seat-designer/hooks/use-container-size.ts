/**
 * ResizeObserver-based container size hook.
 * Tracks dimensions of a DOM element and updates on resize.
 */

import { useState, useEffect, useRef, RefObject } from "react";

export interface UseContainerSizeOptions {
  /** Lock size on first measurement (for no-image mode). Reset when resetLockKey changes. */
  lockFirstSize?: boolean;
  /** When this changes, clear the locked size (e.g. layout.id) */
  resetLockKey?: string | number | null;
  /** Only update when this becomes true (e.g. when canvas is ready) */
  enabled?: boolean;
  /** Minimum dimension delta to trigger update (avoids micro-updates) */
  dimensionDeltaThreshold?: number;
  /** Throttle debounce ms (0 = no throttle) */
  throttleMs?: number;
}

const DEFAULT_OPTIONS: Required<Omit<UseContainerSizeOptions, "resetLockKey">> & {
  resetLockKey?: string | number | null;
} = {
  lockFirstSize: false,
  enabled: true,
  dimensionDeltaThreshold: 0,
  throttleMs: 0,
  resetLockKey: undefined,
};

export function useContainerSize(
  containerRef: RefObject<HTMLDivElement | null>,
  options: UseContainerSizeOptions = {},
): { width: number; height: number } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [size, setSize] = useState({ width: 800, height: 600 });
  const lockedRef = useRef<{ width: number; height: number } | null>(null);
  const prevResetKeyRef = useRef(opts.resetLockKey);

  // Reset lock when resetLockKey changes (e.g. layout change)
  if (prevResetKeyRef.current !== opts.resetLockKey) {
    prevResetKeyRef.current = opts.resetLockKey;
    lockedRef.current = null;
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !opts.enabled) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.floor(rect.width) || 800;
      const height = Math.floor(rect.height) || 600;

      if (width <= 0 || height <= 0) return;

      if (opts.lockFirstSize) {
        if (!lockedRef.current) {
          lockedRef.current = { width, height };
        }
        setSize(lockedRef.current);
        return;
      }

      lockedRef.current = null;

      if (opts.dimensionDeltaThreshold > 0) {
        setSize((prev) => {
          const wDiff = Math.abs(prev.width - width);
          const hDiff = Math.abs(prev.height - height);
          if (
            wDiff <= opts.dimensionDeltaThreshold &&
            hDiff <= opts.dimensionDeltaThreshold
          ) {
            return prev;
          }
          return { width, height };
        });
      } else {
        setSize({ width, height });
      }
    };

    updateSize();

    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleUpdate = () => {
      if (opts.throttleMs > 0) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(updateSize, opts.throttleMs);
      } else {
        updateSize();
      }
    };

    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(el);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [
    containerRef,
    opts.enabled,
    opts.lockFirstSize,
    opts.dimensionDeltaThreshold,
    opts.throttleMs,
  ]);

  return size;
}
