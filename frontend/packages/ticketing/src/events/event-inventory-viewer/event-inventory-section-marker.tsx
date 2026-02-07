/**
 * Event Inventory Viewer – section marker (Konva) for a section
 */

import { useRef, useEffect, useState } from "react";
import { Group, Text } from "react-konva";
import Konva from "konva";
import type { Section } from "../../layouts/types";
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

  let statusColor = { fill: "#9ca3af", stroke: "#6b7280" };
  if (eventSeatCount > 0) {
    if (statusCounts["sold"] > 0) {
      statusColor = { fill: "#3b82f6", stroke: "#2563eb" };
    } else if (statusCounts["reserved"] > 0) {
      statusColor = { fill: "#f59e0b", stroke: "#d97706" };
    } else if (statusCounts["held"] > 0) {
      statusColor = { fill: "#a855f7", stroke: "#9333ea" };
    } else if (statusCounts["blocked"] > 0) {
      statusColor = { fill: "#ef4444", stroke: "#dc2626" };
    } else if (statusCounts["available"] > 0) {
      statusColor = { fill: "#10b981", stroke: "#059669" };
    }
  }

  const parsedShape = parseShape(section.shape);
  const hasShape = !!parsedShape;

  const configFill = parsedShape?.fillColor?.trim();
  const configStroke = parsedShape?.strokeColor?.trim();
  const isDefaultOrEmpty = (v: string | undefined, d: string) =>
    !v ||
    v.toLowerCase().replace(/^#/, "") === d.toLowerCase().replace(/^#/, "");
  const colors = {
    fill: !isDefaultOrEmpty(configFill, "#60a5fa")
      ? configFill!
      : statusColor.fill,
    stroke: !isDefaultOrEmpty(configStroke, "#2563eb")
      ? configStroke!
      : statusColor.stroke,
  };

  const baseOpacity = 0.5;
  const hoverOpacity = 0.75;
  const currentOpacity =
    isHovered || isHoveredState ? hoverOpacity : baseOpacity;

  const strokeWidth = isHovered || isHoveredState ? 2.5 : 1.5;

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
      fontSize: isHovered || isHoveredState ? 15 : 14,
      shadowBlur: isHovered || isHoveredState ? 4 : 2,
      backgroundStrokeWidth: strokeWidth,
      duration: 0.2,
      easing: Konva.Easings.EaseInOut,
    });
  }, [isHovered, isHoveredState, strokeWidth, hasShape]);

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
              { fill: colors.fill, stroke: colors.stroke },
              imageWidth,
              imageHeight,
              strokeWidth,
              1
            )}
          </Group>
          <Text
            ref={textRef}
            text={section.name}
            fontSize={10}
            fontFamily="Arial"
            fill="#1e293b"
            padding={2}
            align="center"
            verticalAlign="middle"
            listening={false}
            x={-24}
            y={8}
            width={48}
            backgroundFill="rgba(255, 255, 255, 0.9)"
            backgroundStroke="#e2e8f0"
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
          fill={isHovered || isHoveredState ? "#1e3a8a" : "#1e40af"}
          padding={8}
          align="center"
          verticalAlign="middle"
          backgroundFill={colors.fill}
          backgroundStroke={colors.stroke}
          backgroundStrokeWidth={strokeWidth}
          cornerRadius={4}
          x={-30}
          y={-10}
          shadowBlur={2}
          shadowColor="rgba(0,0,0,0.2)"
          opacity={currentOpacity}
        />
      )}
    </Group>
  );
}
