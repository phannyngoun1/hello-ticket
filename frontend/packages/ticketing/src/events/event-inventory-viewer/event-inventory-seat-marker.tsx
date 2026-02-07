/**
 * Event Inventory Viewer – seat marker (Konva) for a single seat
 */

import { useRef, useEffect, useState } from "react";
import { Group } from "react-konva";
import Konva from "konva";
import type { Seat } from "../../seats/types";
import type { EventSeat } from "../types";
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
    statusColors = { fill: "#9ca3af", stroke: "#6b7280" };
  }

  const parsedShape = parseShape(seat.shape);

  const configFill = parsedShape?.fillColor?.trim();
  const configStroke = parsedShape?.strokeColor?.trim();
  const isDefaultOrEmpty = (v: string | undefined, d: string) =>
    !v ||
    v.toLowerCase().replace(/^#/, "") === d.toLowerCase().replace(/^#/, "");
  const fillColor = isSelected
    ? "#06b6d4"
    : !isDefaultOrEmpty(configFill, "#60a5fa")
      ? configFill!
      : statusColors.fill;
  const borderColor = isSelected
    ? "#0891b2"
    : !isDefaultOrEmpty(configStroke, "#2563eb")
      ? configStroke!
      : statusColors.stroke;

  const isAvailableForSelection = eventSeat?.status === "available";

  const baseOpacity = 0.3;
  const hoverOpacity = isAvailableForSelection ? 0.8 : 0.5;
  const selectedOpacity = 0.95;

  const currentOpacity = isSelected
    ? selectedOpacity
    : isHovered || isHoveredState
      ? hoverOpacity
      : baseOpacity;

  const strokeWidth = isSelected ? 4 : isHovered || isHoveredState ? 3 : 2;

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
          { fill: fillColor, stroke: borderColor },
          imageWidth,
          imageHeight,
          strokeWidth,
          1
        )}
      </Group>
    </Group>
  );
}
