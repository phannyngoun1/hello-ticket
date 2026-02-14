/**
 * Section Marker Component for Layout Canvas
 * Renders section markers with shape, transformer, and drag support.
 */

import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { Group, Circle, Transformer } from "react-konva";
import Konva from "konva";
import {
  PlacementShapeType,
  type PlacementShape,
  type SectionMarker,
} from "../types";
import { ANCHOR_FILL, ANCHOR_STROKE } from "../colors";
import { ShapeRenderer } from "../components/shape-renderer";

export interface SectionMarkerCanvasProps {
  section: SectionMarker;
  x: number;
  y: number;
  isSelected: boolean;
  isAnchor?: boolean;
  isPlacingSections: boolean;
  isPanning: boolean;
  isSpacePressed: boolean;
  isPlacingSeats: boolean;
  selectedShapeTool?: PlacementShapeType | null;
  onSectionClick?: (
    section: SectionMarker,
    event?: { shiftKey?: boolean },
  ) => void;
  onSectionDoubleClick?: (section: SectionMarker) => void;
  onSectionDragEnd?: (sectionId: string, newX: number, newY: number) => void;
  onSectionDragMove?: (
    sectionId: string,
    stageX: number,
    stageY: number,
  ) => void;
  onShapeTransform?: (
    sectionId: string,
    shape: PlacementShape,
    position?: { x: number; y: number },
  ) => void;
  /** Convert layer coords to percentage (0-100) - needed to propagate position after resize */
  layerToPercentage?: (layerX: number, layerY: number) => { x: number; y: number };
  imageWidth: number;
  imageHeight: number;
  readOnly?: boolean;
  disableHoverAnimation?: boolean;
  onSectionDragStart?: (sectionId: string) => void;
  useLowDetail?: boolean;
  colors: { fill: string; stroke: string };
  forceDraggable?: boolean;
  /** Called during transform to force redraw (e.g. so other selected objects' boxes update) */
  onTransformProgress?: () => void;
}

export function SectionMarkerCanvas({
  section,
  x,
  y,
  isSelected,
  isAnchor = false,
  isPlacingSections,
  isPanning,
  isSpacePressed,
  isPlacingSeats,
  selectedShapeTool,
  onSectionClick,
  onSectionDoubleClick,
  onSectionDragEnd,
  onSectionDragMove,
  onShapeTransform,
  layerToPercentage,
  imageWidth,
  imageHeight,
  readOnly = false,
  disableHoverAnimation = false,
  onSectionDragStart,
  useLowDetail = false,
  colors,
  forceDraggable = false,
  onTransformProgress,
}: SectionMarkerCanvasProps) {
  const groupRef = useRef<Konva.Group>(null);
  const shapeRef = useRef<Konva.Shape>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isHovered, setIsHovered] = useState(false);

  const defaultShape: PlacementShape = {
    type: PlacementShapeType.RECTANGLE,
    width: 2,
    height: 1.5,
  };
  const shape = section.shape || defaultShape;

  const shapeKey = useMemo(() => {
    if (!section.shape) return null;
    return JSON.stringify({
      type: shape.type,
      width: shape.width,
      height: shape.height,
      radius: shape.radius,
      points: shape.points,
      rotation: shape.rotation,
    });
  }, [
    section.shape,
    shape.type,
    shape.width,
    shape.height,
    shape.radius,
    shape.points,
    shape.rotation,
  ]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    if (isSelected && section.shape) {
      group.clearCache();
      // Update Transformer after cache is cleared; defer 2 frames so canvas has fully rendered
      if (!readOnly && transformerRef.current) {
        const tr = transformerRef.current;
        let rafId2: number | undefined;
        const rafId = requestAnimationFrame(() => {
          rafId2 = requestAnimationFrame(() => {
            tr.nodes([group]);
            tr.forceUpdate();
            tr.getLayer()?.batchDraw();
          });
        });
        return () => {
          cancelAnimationFrame(rafId);
          if (rafId2 !== undefined) cancelAnimationFrame(rafId2);
        };
      }
    } else if (!useLowDetail && section.shape) {
      group.clearCache();
      group.cache();
    }
    // Include x,y so Transformer updates when marker position changes (e.g. on container resize)
  }, [isSelected, useLowDetail, section.shape, shapeKey, readOnly, Math.round(x), Math.round(y)]);

  const handleTransformEnd = useCallback(() => {
    if (!groupRef.current || !onShapeTransform || !section.shape) return;

    const node = groupRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    node.scaleX(1);
    node.scaleY(1);

    // Konva Transformer can change node position when resizing (keeps opposite corner fixed).
    // Capture and propagate the new position to prevent unpredictable position shifts.
    let position: { x: number; y: number } | undefined;
    if (layerToPercentage) {
      position = layerToPercentage(node.x(), node.y());
    }

    const updatedShape: PlacementShape = { ...shape };

    if (shape.type === PlacementShapeType.CIRCLE) {
      const currentRadius = shape.radius
        ? (shape.radius / 100) * Math.min(imageWidth, imageHeight)
        : 12;
      const newRadius =
        currentRadius * Math.max(Math.abs(scaleX), Math.abs(scaleY));
      const minRadiusPercent = 0.1;
      updatedShape.radius = Math.max(
        minRadiusPercent,
        (newRadius / Math.min(imageWidth, imageHeight)) * 100,
      );
    } else if (
      shape.type === PlacementShapeType.RECTANGLE ||
      shape.type === PlacementShapeType.ELLIPSE ||
      shape.type === PlacementShapeType.SEAT
    ) {
      const currentWidth = shape.width ? (shape.width / 100) * imageWidth : 30;
      const currentHeight = shape.height
        ? (shape.height / 100) * imageHeight
        : 20;
      const minWidthPercent = 0.1;
      const minHeightPercent = 0.1;
      updatedShape.width = Math.max(
        minWidthPercent,
        (Math.abs(currentWidth * scaleX) / imageWidth) * 100,
      );
      updatedShape.height = Math.max(
        minHeightPercent,
        (Math.abs(currentHeight * scaleY) / imageHeight) * 100,
      );
      if (
        shape.type === PlacementShapeType.RECTANGLE &&
        updatedShape.cornerRadius
      ) {
        const maxCornerRadius =
          Math.min(
            (updatedShape.width / 100) * imageWidth,
            (updatedShape.height / 100) * imageHeight,
          ) / 2;
        updatedShape.cornerRadius = Math.min(
          updatedShape.cornerRadius,
          (maxCornerRadius / imageWidth) * 100,
        );
      }
    } else if (shape.type === PlacementShapeType.FREEFORM && shape.points) {
      const avgScale = Math.abs((scaleX + scaleY) / 2);
      updatedShape.points = shape.points.map((p) => p * avgScale);
    } else if (shape.type === PlacementShapeType.POLYGON && shape.points) {
      const avgScale = Math.abs((scaleX + scaleY) / 2);
      updatedShape.points = shape.points.map((p) => p * avgScale);
    } else if (
      shape.type === PlacementShapeType.SOFA ||
      shape.type === PlacementShapeType.STAGE
    ) {
      // Sofa and stage: fixed aspect ratio - use uniform scale for both dimensions
      const avgScale = Math.abs((scaleX + scaleY) / 2);
      const currentWidth = shape.width ? (shape.width / 100) * imageWidth : 36;
      const currentHeight = shape.height
        ? (shape.height / 100) * imageHeight
        : 24;
      const minWidthPercent = shape.type === PlacementShapeType.STAGE ? 5 : 2;
      const minHeightPercent = shape.type === PlacementShapeType.STAGE ? 3 : 1.5;
      updatedShape.width = Math.max(
        minWidthPercent,
        (Math.abs(currentWidth * avgScale) / imageWidth) * 100,
      );
      updatedShape.height = Math.max(
        minHeightPercent,
        (Math.abs(currentHeight * avgScale) / imageHeight) * 100,
      );
    }

    updatedShape.rotation = rotation;
    onShapeTransform(section.id, updatedShape, position);

    setTimeout(() => {
      if (transformerRef.current && groupRef.current) {
        transformerRef.current.nodes([groupRef.current]);
        transformerRef.current.forceUpdate();
        transformerRef.current.getLayer()?.batchDraw();
      }
    }, 0);
  }, [
    shape,
    imageWidth,
    imageHeight,
    onShapeTransform,
    section.id,
    section.shape,
    layerToPercentage,
  ]);

  useEffect(() => {
    if (disableHoverAnimation) return;
    const shapeNode = shapeRef.current;
    if (!shapeNode || !isPlacingSections || isSelected) return;

    const hoverStrokeWidth = isHovered ? 0.75 : 0.5;
    shapeNode.to({
      stroke: colors.stroke,
      strokeWidth: hoverStrokeWidth,
      duration: 0.2,
      easing: Konva.Easings.EaseInOut,
    });
  }, [
    isHovered,
    isSelected,
    isPlacingSections,
    disableHoverAnimation,
    colors.stroke,
  ]);

  const fillColor = isAnchor ? ANCHOR_FILL : colors.fill;
  const strokeColor = isAnchor ? ANCHOR_STROKE : colors.stroke;
  const strokeWidth = isAnchor ? 1 : isSelected ? 1.5 : 1;
  const fillOpacity = isAnchor ? 0.6 : isSelected ? 0.5 : 0.35;

  return (
    <>
      <Group
        ref={groupRef}
        x={x}
        y={y}
        rotation={shape.rotation || 0}
        draggable={
          !readOnly &&
          (forceDraggable ||
            (isPlacingSections || isPlacingSeats || !selectedShapeTool))
        }
        onDragStart={
          !readOnly && onSectionDragStart
            ? () => onSectionDragStart(section.id)
            : undefined
        }
        onDragMove={
          !readOnly && onSectionDragMove
            ? (e) =>
                onSectionDragMove(section.id, e.target.x(), e.target.y())
            : undefined
        }
        onDragEnd={
          !readOnly
            ? (e) => {
                if (!onSectionDragEnd) return;
                const node = e.target;
                onSectionDragEnd(section.id, node.x(), node.y());
              }
            : undefined
        }
        onTransformEnd={
          !readOnly && section.shape ? handleTransformEnd : undefined
        }
        onMouseDown={(e) => {
          if (selectedShapeTool === PlacementShapeType.FREEFORM) return;
          e.cancelBubble = true;
        }}
        onClick={(e) => {
          if (selectedShapeTool === PlacementShapeType.FREEFORM) return;
          e.cancelBubble = true;
          const shiftKey = e.evt.shiftKey || false;
          onSectionClick?.(section, { shiftKey });
        }}
        onDblClick={(e) => {
          if (selectedShapeTool === PlacementShapeType.FREEFORM) return;
          e.cancelBubble = true;
          onSectionDoubleClick?.(section);
        }}
        onTap={(e: any) => {
          if (selectedShapeTool === PlacementShapeType.FREEFORM) return;
          e.cancelBubble = true;
          const shiftKey = e.evt?.shiftKey || false;
          onSectionClick?.(section, { shiftKey });
        }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = selectedShapeTool
              ? "crosshair"
              : isSelected && section.shape
                ? "move"
                : (isPlacingSections || isPlacingSeats || !selectedShapeTool) &&
                    section.shape
                  ? "grab"
                : "pointer";
          }
          setIsHovered(true);
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor =
              isPanning || isSpacePressed
                ? "grab"
                : selectedShapeTool || isPlacingSeats || isPlacingSections
                  ? "crosshair"
                  : "pointer";
          }
          setIsHovered(false);
        }}
      >
        {section.shape && (
          <Group ref={shapeRef as any}>
            {useLowDetail ? (
              <Circle
                radius={4}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                opacity={fillOpacity}
                perfectDrawEnabled={false}
              />
            ) : (
              <ShapeRenderer
                shape={shape}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                imageWidth={imageWidth}
                imageHeight={imageHeight}
                opacity={fillOpacity}
                rotationFromParent={true}
              />
            )}
          </Group>
        )}
        {!section.shape && (
          <Circle
            radius={isSelected ? 12 : 10}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={isAnchor ? 2 : strokeWidth}
            x={0}
            y={0}
            opacity={fillOpacity}
          />
        )}
      </Group>
      {isSelected && !readOnly && section.shape && (
        <Transformer
          ref={transformerRef}
          onTransform={onTransformProgress}
          onTransformStart={onTransformProgress}
          boundBoxFunc={(oldBox, newBox) => {
            const minSize = 10;
            if (
              Math.abs(newBox.width) < minSize ||
              Math.abs(newBox.height) < minSize
            ) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={true}
          resizeEnabled={true}
          borderEnabled={true}
          borderStroke="#3b82f6"
          borderStrokeWidth={1.5}
          anchorFill="#ffffff"
          anchorStroke="#3b82f6"
          anchorStrokeWidth={1.5}
          anchorSize={10}
          anchorCornerRadius={2}
          padding={0}
          ignoreStroke={true}
          keepRatio={
            shape.type === PlacementShapeType.SOFA ||
            shape.type === PlacementShapeType.STAGE
          }
          flipEnabled={false}
          enabledAnchors={
            shape.type === PlacementShapeType.SOFA ||
            shape.type === PlacementShapeType.STAGE
              ? ["top-left", "top-right", "bottom-left", "bottom-right"]
              : [
                  "top-left",
                  "top-center",
                  "top-right",
                  "middle-left",
                  "middle-right",
                  "bottom-left",
                  "bottom-center",
                  "bottom-right",
                ]
          }
          onMouseDown={(e) => {
            e.cancelBubble = true;
            const target = e.target;
            const stage = target.getStage();
            const container = stage?.container();
            if (!transformerRef.current || !stage || !container) return;

            const stagePos = stage.getPointerPosition();
            if (!stagePos) return;

            const transformer = transformerRef.current;
            const layer = transformer.getLayer();
            if (!layer || !groupRef.current) return;

            const layerScale = layer.scaleX();
            const node = groupRef.current;
            const nodeX = node.x();
            const nodeY = node.y();
            const nodeHeight = node.height();

            const rotationHandleOffset = 25 / layerScale;
            const rotationHandleY =
              nodeY - nodeHeight / 2 - rotationHandleOffset;
            const rotationHandleX = nodeX;
            const handleSize = 12 / layerScale;

            const distanceX = Math.abs(stagePos.x - rotationHandleX);
            const distanceY = Math.abs(stagePos.y - rotationHandleY);
            const isNearRotationHandle =
              distanceX < handleSize &&
              distanceY < handleSize + 15 / layerScale;

            if (isNearRotationHandle) {
              container.style.cursor = "grabbing";
            }
          }}
          onMouseMove={(e) => {
            e.cancelBubble = true;
            const target = e.target;
            const stage = target.getStage();
            const container = stage?.container();
            if (!transformerRef.current || !stage || !container) return;

            const stagePos = stage.getPointerPosition();
            if (!stagePos) return;

            const transformer = transformerRef.current;
            const layer = transformer.getLayer();
            if (!layer || !groupRef.current) return;

            const layerScale = layer.scaleX();
            const node = groupRef.current;
            const nodeX = node.x();
            const nodeY = node.y();
            const nodeHeight = node.height();

            const rotationHandleOffset = 25 / layerScale;
            const rotationHandleY =
              nodeY - nodeHeight / 2 - rotationHandleOffset;
            const rotationHandleX = nodeX;
            const handleSize = 12 / layerScale;

            const distanceX = Math.abs(stagePos.x - rotationHandleX);
            const distanceY = Math.abs(stagePos.y - rotationHandleY);
            const isNearRotationHandle =
              distanceX < handleSize &&
              distanceY < handleSize + 15 / layerScale;

            if (isNearRotationHandle) {
              container.style.cursor = "grab";
            } else {
              container.style.cursor = selectedShapeTool ? "crosshair" : "pointer";
            }
          }}
          onMouseEnter={(e) => {
            e.cancelBubble = true;
          }}
          onMouseLeave={(e) => {
            const target = e.target;
            const stage = target.getStage();
            const container = stage?.container();
            if (container) {
              container.style.cursor = selectedShapeTool ? "crosshair" : "pointer";
            }
          }}
          onMouseUp={(e) => {
            e.cancelBubble = true;
            const target = e.target;
            const stage = target.getStage();
            const container = stage?.container();
            if (container) {
              container.style.cursor = selectedShapeTool ? "crosshair" : "pointer";
            }
          }}
        />
      )}
    </>
  );
}

export const MemoizedSectionMarkerCanvas = React.memo(SectionMarkerCanvas);
