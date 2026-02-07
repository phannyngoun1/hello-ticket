/**
 * Event Inventory Viewer – section marker (Konva) for a section
 */

import { useRef, useEffect, useState } from "react";
import { Group, Text } from "react-konva";
import Konva from "konva";
import type { Section } from "../../layouts/types";
import {
  AMBER_FILL,
  AMBER_STROKE,
  BLUE_FILL,
  BLUE_STROKE,
  DEFAULT_SHAPE_FILL,
  DEFAULT_SHAPE_STROKE,
  GRAY_FILL,
  GRAY_STROKE,
  GREEN_FILL,
  GREEN_HOVER_FILL,
  GREEN_HOVER_STROKE,
  GREEN_STROKE,
  LABEL_BACKGROUND_FILL,
  LABEL_BACKGROUND_STROKE,
  LABEL_SHADOW_COLOR,
  LABEL_TEXT_FILL,
  PURPLE_FILL,
  PURPLE_STROKE,
  RED_FILL,
  RED_STROKE,
  GRAY_HOVER_FILL,
  BLUE_HOVER_FILL,
  AMBER_HOVER_FILL,
  PURPLE_HOVER_FILL,
  RED_HOVER_FILL,
} from "./event-inventory-viewer-colors";
import { parseShape, renderShape } from "./event-inventory-viewer-utils";

export interface SectionMarkerProps {
  section: Section;
  x: number;
  y: number;
  isHovered: boolean;
  isSpacePressed: boolean;
  totalSeats: number;
  eventSeatCount: number;
  statusCounts: Record<string, number>;
  imageWidth: number;
  imageHeight: number;
  onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export function SectionMarker({
  section,
  x,
  y,
  isHovered,
  isSpacePressed,
  eventSeatCount,
  statusCounts,
  imageWidth,
  imageHeight,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onClick,
}: SectionMarkerProps) {
  const groupRef = useRef<Konva.Group>(null);
  const shapeGroupRef = useRef<Konva.Group>(null);
  const textRef = useRef<Konva.Text>(null);
  const [isHoveredState, setIsHoveredState] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  let statusColor = { fill: GRAY_FILL, stroke: GRAY_STROKE };
  if (eventSeatCount > 0) {
    if (statusCounts["sold"] > 0) {
      statusColor = { fill: BLUE_FILL, stroke: BLUE_STROKE };
    } else if (statusCounts["reserved"] > 0) {
      statusColor = { fill: AMBER_FILL, stroke: AMBER_STROKE };
    } else if (statusCounts["held"] > 0) {
      statusColor = { fill: PURPLE_FILL, stroke: PURPLE_STROKE };
    } else if (statusCounts["blocked"] > 0) {
      statusColor = { fill: RED_FILL, stroke: RED_STROKE };
    } else if (statusCounts["available"] > 0) {
      statusColor = { fill: GREEN_FILL, stroke: GREEN_STROKE };
    }
  }

  const parsedShape = parseShape(section.shape);
  const hasShape = !!parsedShape;

  const configFill = parsedShape?.fillColor?.trim();
  const configStroke = parsedShape?.strokeColor?.trim();
  const isDefaultOrEmpty = (v: string | undefined, d: string) =>
    !v ||
    v.toLowerCase().replace(/^#/, "") === d.toLowerCase().replace(/^#/, "");
  /** Colors from shape config; default or empty returns undefined */
  const shapeCodeColors = {
    fill: isDefaultOrEmpty(configFill, DEFAULT_SHAPE_FILL)
      ? undefined
      : configFill!,
    stroke: isDefaultOrEmpty(configStroke, DEFAULT_SHAPE_STROKE)
      ? undefined
      : configStroke!,
  };
  /** Brighter colors for mouse-over state */
  const hoverColors = {
    fill: !isDefaultOrEmpty(configFill, DEFAULT_SHAPE_FILL)
      ? configFill!
      : statusColor.fill === GRAY_FILL
        ? GRAY_HOVER_FILL
        : statusColor.fill === BLUE_FILL
          ? BLUE_HOVER_FILL
          : statusColor.fill === AMBER_FILL
            ? AMBER_HOVER_FILL
            : statusColor.fill === PURPLE_FILL
              ? PURPLE_HOVER_FILL
              : statusColor.fill === RED_FILL
                ? RED_HOVER_FILL
                : GREEN_HOVER_FILL,
    stroke: !isDefaultOrEmpty(configStroke, DEFAULT_SHAPE_STROKE)
      ? configStroke!
      : statusColor.stroke === GRAY_STROKE
        ? GRAY_FILL
        : statusColor.stroke === BLUE_STROKE
          ? BLUE_FILL
          : statusColor.stroke === AMBER_STROKE
            ? AMBER_FILL
            : statusColor.stroke === PURPLE_STROKE
              ? PURPLE_FILL
              : statusColor.stroke === RED_STROKE
                ? RED_FILL
                : GREEN_HOVER_STROKE,
  };
  const isHover = isHovered || isHoveredState;

  const baseOpacity = 0.5;
  const hoverOpacity = 0.75;
  const currentOpacity = isHover ? hoverOpacity : baseOpacity;

  const strokeWidth = isHover ? 2.5 : 1.5;

  useEffect(() => {
    const shapeGroup = shapeGroupRef.current;
    if (!shapeGroup || !hasShape) return;

    shapeGroup.to({
      opacity: currentOpacity,
      duration: 0.2,
      easing: Konva.Easings.EaseInOut,
    });

    const children = shapeGroup.getChildren();
    children.forEach((child) => {
      if (child instanceof Konva.Shape) {
        child.to({
          strokeWidth: strokeWidth,
          duration: 0.2,
          easing: Konva.Easings.EaseInOut,
        });
      }
    });
  }, [currentOpacity, strokeWidth, hasShape]);

  useEffect(() => {
    const text = textRef.current;
    if (!text || hasShape) return;

    text.to({
      fontSize: isHover ? 15 : 14,
      shadowBlur: isHover ? 4 : 2,
      backgroundStrokeWidth: strokeWidth,
      duration: 0.2,
      easing: Konva.Easings.EaseInOut,
    });
  }, [isHover, strokeWidth, hasShape]);

  useEffect(() => {
    if (!isClicked) return;

    const group = groupRef.current;
    if (!group) return;

    group.scaleX(0.9);
    group.scaleY(0.9);

    group.to({
      scaleX: 1,
      scaleY: 1,
      duration: 0.15,
      easing: Konva.Easings.EaseOut,
      onFinish: () => {
        setIsClicked(false);
      },
    });
  }, [isClicked]);

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      rotation={parsedShape?.rotation || 0}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = "pointer";
        }
        setIsHoveredState(true);
        onMouseEnter(e);
      }}
      onMouseMove={(e) => {
        if (onMouseMove) {
          onMouseMove(e);
        }
      }}
      onMouseLeave={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = isSpacePressed ? "grabbing" : "default";
        }
        setIsHoveredState(false);
        onMouseLeave();
      }}
      onClick={(e) => {
        e.cancelBubble = true;
        setIsClicked(true);
        onClick();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        setIsClicked(true);
        onClick();
      }}
      onMouseDown={(e) => {
        e.cancelBubble = true;
      }}
    >
      {hasShape ? (
        <>
          <Group ref={shapeGroupRef} opacity={currentOpacity}>
            {renderShape(
              parsedShape,
              {
                fill: shapeCodeColors.fill,
                stroke: shapeCodeColors.stroke,
              },
              imageWidth,
              imageHeight,
              strokeWidth,
              1,
              { hoverColors, isHover }
            )}
          </Group>
          <Text
            ref={textRef}
            text={section.name}
            fontSize={10}
            fontFamily="Arial"
            fill={LABEL_TEXT_FILL}
            padding={2}
            align="center"
            verticalAlign="middle"
            listening={false}
            x={-24}
            y={8}
            width={48}
            backgroundFill={LABEL_BACKGROUND_FILL}
            backgroundStroke={LABEL_BACKGROUND_STROKE}
            backgroundStrokeWidth={1}
            cornerRadius={2}
          />
        </>
      ) : (
        <Text
          ref={textRef}
          text={section.name}
          fontSize={14}
          fontFamily="Arial"
          // fill={isHovered || isHoveredState ? "#1e3a8a" : "#1e40af"}
          padding={8}
          align="center"
          verticalAlign="middle"
          backgroundFill={
            (isHover ? hoverColors.fill : shapeCodeColors.fill) ??
            statusColor.fill
          }
          backgroundStroke={
            (isHover ? hoverColors.stroke : shapeCodeColors.stroke) ??
            statusColor.stroke
          }
          backgroundStrokeWidth={strokeWidth}
          cornerRadius={4}
          x={-30}
          y={-10}
          shadowBlur={2}
          shadowColor={LABEL_SHADOW_COLOR}
          opacity={currentOpacity}
        />
      )}
    </Group>
  );
}
