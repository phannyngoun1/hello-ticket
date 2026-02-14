/**
 * Letterboxing computation for canvas layouts.
 * Computes displayed dimensions and coordinate conversion for content
 * that fits within a container (with or without an image).
 */

import { useMemo, useCallback } from "react";

export interface UseLetterboxingParams {
  /** Container width */
  containerWidth: number;
  /** Container height */
  containerHeight: number;
  /** Content aspect ratio (height/width). Use image.height/image.width when has image, or NO_IMAGE_ASPECT_RATIO (e.g. 3/4) for no-image mode. */
  contentAspectRatio: number;
  /** Optional: pan offset for stage-to-percentage (for zoom/pan transforms) */
  panOffset?: { x: number; y: number };
  /** Optional: zoom level for stage-to-percentage */
  zoomLevel?: number;
}

export interface UseLetterboxingResult {
  /** Displayed content width (letterboxed) */
  displayedWidth: number;
  /** Displayed content height (letterboxed) */
  displayedHeight: number;
  /** X offset of content within container */
  imageX: number;
  /** Y offset of content within container */
  imageY: number;
  /** Center X for zoom/pan transforms */
  centerX: number;
  /** Center Y for zoom/pan transforms */
  centerY: number;
  /** Convert percentage (0-100) coords to stage/layer coords */
  percentageToStage: (xPercent: number, yPercent: number) => { x: number; y: number };
  /** Convert layer coords to percentage */
  layerToPercentage: (layerX: number, layerY: number) => { x: number; y: number };
  /** Convert stage/pointer coords to percentage (requires panOffset and zoomLevel) */
  stageToPercentage: (stageX: number, stageY: number) => { x: number; y: number };
  /** Alias for stageToPercentage - converts pointer position (stage coords) to percentage */
  pointerToPercentage: (pointerX: number, pointerY: number) => { x: number; y: number };
}

/** Fixed aspect ratio for no-image mode (4:3, matching 800x600 default) */
export const NO_IMAGE_ASPECT_RATIO = 3 / 4;

export function useLetterboxing({
  containerWidth,
  containerHeight,
  contentAspectRatio,
  panOffset = { x: 0, y: 0 },
  zoomLevel = 1,
}: UseLetterboxingParams): UseLetterboxingResult {
  const validWidth = containerWidth > 0 ? containerWidth : 800;
  const validHeight = containerHeight > 0 ? containerHeight : 600;
  const canvasAspectRatio = validHeight / validWidth;

  const { displayedWidth, displayedHeight, imageX, imageY, centerX, centerY } =
    useMemo(() => {
      let dw: number;
      let dh: number;
      if (contentAspectRatio > canvasAspectRatio) {
        dh = validHeight;
        dw = dh / contentAspectRatio;
      } else {
        dw = validWidth;
        dh = dw * contentAspectRatio;
      }
      const ix = (validWidth - dw) / 2;
      const iy = (validHeight - dh) / 2;
      const cx = validWidth / 2;
      const cy = validHeight / 2;
      return {
        displayedWidth: dw,
        displayedHeight: dh,
        imageX: ix,
        imageY: iy,
        centerX: cx,
        centerY: cy,
      };
    }, [
      validWidth,
      validHeight,
      contentAspectRatio,
      canvasAspectRatio,
    ]);

  const percentageToStage = useCallback(
    (xPercent: number, yPercent: number) => ({
      x: imageX + (xPercent / 100) * displayedWidth,
      y: imageY + (yPercent / 100) * displayedHeight,
    }),
    [imageX, imageY, displayedWidth, displayedHeight],
  );

  const layerToPercentage = useCallback(
    (layerX: number, layerY: number) => ({
      x: ((layerX - imageX) / displayedWidth) * 100,
      y: ((layerY - imageY) / displayedHeight) * 100,
    }),
    [imageX, imageY, displayedWidth, displayedHeight],
  );

  const stageToPercentage = useCallback(
    (stageX: number, stageY: number) => {
      const layerX =
        (stageX - centerX - panOffset.x) / zoomLevel + centerX;
      const layerY =
        (stageY - centerY - panOffset.y) / zoomLevel + centerY;
      return layerToPercentage(layerX, layerY);
    },
    [centerX, centerY, panOffset, zoomLevel, layerToPercentage],
  );

  const pointerToPercentage = useCallback(
    (pointerX: number, pointerY: number) => stageToPercentage(pointerX, pointerY),
    [stageToPercentage],
  );

  return {
    displayedWidth,
    displayedHeight,
    imageX,
    imageY,
    centerX,
    centerY,
    percentageToStage,
    layerToPercentage,
    stageToPercentage,
    pointerToPercentage,
  };
}
