/**
 * Event Inventory Viewer – seat marker (Konva) for a single seat
 */

import { useRef, useEffect, useState } from "react";
import { Group, Circle, Text } from "react-konva";
import Konva from "konva";
import type { Seat } from "../../seats/types";
import type { EventSeat } from "../../events/types";
import {
  AMBER_FILL,
  AMBER_STROKE,
  BLUE_FILL,
  BLUE_STROKE,
  DEFAULT_SHAPE_FILL,
  DEFAULT_SHAPE_STROKE,
  GRAY_FILL,
  GRAY_STROKE,
  GREEN_HOVER_FILL,
  GREEN_HOVER_STROKE,
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
  position: { x: number; y: number };
  display: {
    isHovered: boolean;
    isSpacePressed: boolean;
    isSelected?: boolean;
    imageWidth: number;
    imageHeight: number;
    markerFillTransparency?: number;
  };
  handlers: {
    onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
    onMouseMove?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
    onMouseLeave: () => void;
    onClick: () => void;
  };
}

export function SeatMarker({
  seat,
  eventSeat,
  position: { x, y },
  display: {
    isHovered,
    isSpacePressed,
    isSelected = false,
    imageWidth,
    imageHeight,
    markerFillTransparency = 1.0,
  },
  handlers: { onMouseEnter, onMouseMove, onMouseLeave, onClick },
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

  /** Map status fill to hover fill variant */
  const getStatusHoverFill = (fill: string) => {
    if (fill === GRAY_FILL) return GRAY_HOVER_FILL;
    if (fill === BLUE_FILL) return BLUE_HOVER_FILL;
    if (fill === AMBER_FILL) return AMBER_HOVER_FILL;
    if (fill === PURPLE_FILL) return PURPLE_HOVER_FILL;
    if (fill === RED_FILL) return RED_HOVER_FILL;
    return GREEN_HOVER_FILL;
  };
  /** Map status stroke to hover stroke variant */
  const getStatusHoverStroke = (stroke: string) => {
    if (stroke === GRAY_STROKE) return GRAY_FILL;
    if (stroke === BLUE_STROKE) return BLUE_FILL;
    if (stroke === AMBER_STROKE) return AMBER_FILL;
    if (stroke === PURPLE_STROKE) return PURPLE_FILL;
    if (stroke === RED_STROKE) return RED_FILL;
    return GREEN_HOVER_STROKE;
  };

  /** Brighter colors for mouse-over state */
  const hoverFill = !isDefaultOrEmpty(configFill, DEFAULT_SHAPE_FILL)
    ? configFill!
    : getStatusHoverFill(statusColors.fill);
  const hoverStroke = !isDefaultOrEmpty(configStroke, DEFAULT_SHAPE_STROKE)
    ? configStroke!
    : getStatusHoverStroke(statusColors.stroke);
  const hoverColors = { fill: hoverFill, stroke: hoverStroke };

  const isHover = isHovered || isHoveredState;
  const fillColor = isSelected
    ? SELECTED_FILL
    : (hoverColors.fill ?? statusColors.fill);
  const strokeColor = isSelected
    ? SELECTED_STROKE
    : (hoverColors.stroke ?? statusColors.stroke);

  const isAvailableForSelection = eventSeat?.status === "available";

  const baseOpacity = markerFillTransparency;
  const hoverOpacity = 0.3;
  const selectedOpacity = 1;

  let currentOpacity: number;
  if (isSelected) currentOpacity = selectedOpacity;
  else if (isHover) currentOpacity = hoverOpacity;
  else currentOpacity = baseOpacity;

  let strokeWidth: number;
  if (isSelected) strokeWidth = 3;
  else if (isHover) strokeWidth = 1.5;
  else strokeWidth = 1;

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

  // Calculate checkmark size based on seat dimensions (clamped 6–12, default 8)
  const rawCheckmarkSize = parsedShape?.width ? parsedShape.width * 0.15 : 8;
  const checkmarkRadius = Math.min(Math.max(rawCheckmarkSize, 6), 12);
  const checkmarkFontSize = checkmarkRadius * 1.75;

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
            { fill: fillColor, stroke: strokeColor },
            imageWidth,
            imageHeight,
            0,
            1,
          )}
        </Group>
      )}

      <Group ref={shapeGroupRef} opacity={currentOpacity}>
        {renderShape(
          parsedShape,
          {
            fill: shapeCodeColors.fill ?? fillColor,
            stroke: shapeCodeColors.stroke ?? strokeColor,
          },
          imageWidth,
          imageHeight,
          strokeWidth,
          1,
          {
            hoverColors: {
              fill: shapeCodeColors.fill ?? hoverColors.fill,
              stroke: shapeCodeColors.stroke ?? hoverColors.stroke,
            },
            isHover,
          },
        )}
      </Group>

      {/* Checkmark indicator for selected/booked seats */}
      {isSelected && (
        <Group>
          <Circle
            x={0}
            y={0}
            radius={checkmarkRadius}
            fill="#ef4444"
            stroke="#fff"
            strokeWidth={2}
          />
          <Text
            x={-checkmarkRadius * 0.6}
            y={-checkmarkRadius * 0.85}
            text="✓"
            fontSize={checkmarkFontSize}
            fill="#fff"
            fontStyle="bold"
          />
        </Group>
      )}
    </Group>
  );
}
