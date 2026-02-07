/**
 * Event Inventory Viewer – seat marker (Konva) for a single seat
 */

import { useRef, useEffect, useState } from "react";
import { Group } from "react-konva";
import Konva from "konva";
import type { Seat } from "../../seats/types";
import type { EventSeat } from "../types";
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
  PURPLE_FILL,
  PURPLE_STROKE,
  RED_FILL,
  RED_STROKE,
  SELECTED_FILL,
  SELECTED_STROKE,
  GRAY_HOVER_FILL,
  BLUE_HOVER_FILL,
  AMBER_HOVER_FILL,
  PURPLE_HOVER_FILL,
  RED_HOVER_FILL,
} from "./event-inventory-viewer-colors";
import {
  getTicketStatusColor,
  getSeatStatusColor,
  getSeatStatusTransparency,
  parseShape,
  renderShape,
} from "./event-inventory-viewer-utils";

export interface SeatMarkerProps {
  seat: Seat;
  eventSeat?: EventSeat;
  x: number;
  y: number;
  isHovered: boolean;
  isSpacePressed: boolean;
  isSelected?: boolean;
  imageWidth: number;
  imageHeight: number;
  onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseMove?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export function SeatMarker({
  seat,
  eventSeat,
  x,
  y,
  isHovered,
  isSpacePressed,
  isSelected = false,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onClick,
  imageWidth,
  imageHeight,
}: SeatMarkerProps) {
  const shapeGroupRef = useRef<Konva.Group>(null);
  const [isHoveredState, setIsHoveredState] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  let statusColors: { fill: string; stroke: string };

  if (eventSeat?.ticket_status) {
    const ticketColors = getTicketStatusColor(eventSeat.ticket_status);
    if (ticketColors) {
      statusColors = ticketColors;
    } else {
      statusColors = getSeatStatusColor(eventSeat.status);
    }
  } else if (eventSeat) {
    statusColors = getSeatStatusColor(eventSeat.status);
  } else {
    statusColors = { fill: GRAY_FILL, stroke: GRAY_STROKE };
  }

  const parsedShape = parseShape(seat.shape);

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
      : statusColors.fill === GRAY_FILL
        ? GRAY_HOVER_FILL
        : statusColors.fill === BLUE_FILL
          ? BLUE_HOVER_FILL
          : statusColors.fill === AMBER_FILL
            ? AMBER_HOVER_FILL
            : statusColors.fill === PURPLE_FILL
              ? PURPLE_HOVER_FILL
              : statusColors.fill === RED_FILL
                ? RED_HOVER_FILL
                : GREEN_HOVER_FILL,
    stroke: !isDefaultOrEmpty(configStroke, DEFAULT_SHAPE_STROKE)
      ? configStroke!
      : statusColors.stroke === GRAY_STROKE
        ? GRAY_FILL
        : statusColors.stroke === BLUE_STROKE
          ? BLUE_FILL
          : statusColors.stroke === AMBER_STROKE
            ? AMBER_FILL
            : statusColors.stroke === PURPLE_STROKE
              ? PURPLE_FILL
              : statusColors.stroke === RED_STROKE
                ? RED_FILL
                : GREEN_HOVER_STROKE,
  };

  const isHover = isHovered || isHoveredState;
  const fillColor = isSelected
    ? SELECTED_FILL
    : ((isHover ? hoverColors.fill : shapeCodeColors.fill) ??
      statusColors.fill);
  const borderColor = isSelected
    ? SELECTED_STROKE
    : ((isHover ? hoverColors.stroke : shapeCodeColors.stroke) ??
      statusColors.stroke);

  const isAvailableForSelection = eventSeat?.status === "available";

  const baseOpacity = 0.3;
  const hoverOpacity = isAvailableForSelection ? 0.8 : 0.5;
  const selectedOpacity = 0.95;

  const currentOpacity = isSelected
    ? selectedOpacity
    : isHover
      ? hoverOpacity
      : baseOpacity;

  const strokeWidth = isSelected ? 4 : isHover ? 3 : 2;

  useEffect(() => {
    const shapeGroup = shapeGroupRef.current;
    if (!shapeGroup) return;

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
  }, [currentOpacity, strokeWidth]);

  useEffect(() => {
    if (!isClicked) return;

    const shapeGroup = shapeGroupRef.current;
    if (!shapeGroup) return;

    shapeGroup.scaleX(0.9);
    shapeGroup.scaleY(0.9);

    shapeGroup.to({
      scaleX: 1,
      scaleY: 1,
      duration: 0.15,
      easing: Konva.Easings.EaseOut,
      onFinish: () => {
        setIsClicked(false);
      },
    });
  }, [isClicked]);

  const statusTransparency = eventSeat
    ? getSeatStatusTransparency(eventSeat.status)
    : 0;

  return (
    <Group
      x={x}
      y={y}
      onMouseEnter={(e) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = isAvailableForSelection
            ? "pointer"
            : "not-allowed";
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
      {(currentOpacity > 0 || isSelected) && eventSeat && (
        <Group opacity={statusTransparency * currentOpacity}>
          {renderShape(
            parsedShape,
            { fill: fillColor, stroke: "transparent" },
            imageWidth,
            imageHeight,
            0,
            1
          )}
        </Group>
      )}

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
    </Group>
  );
}
