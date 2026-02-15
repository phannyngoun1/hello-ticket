import React from "react";
import {
  Circle,
  Square,
  Hexagon,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  RectangleHorizontal,
  RectangleVertical,
  PenTool,
  MoreHorizontal,
  Armchair,
  Presentation,
  LayoutTemplate,
  Pill,
} from "lucide-react";
import { PlacementShapeType } from "../../types";
import { cn } from "@truths/ui/lib/utils";
import type { ShapeToolboxAlign } from "./types";

/** Shared styles for toolbar icon buttons */
export const TOOLBAR_BUTTON =
  "flex items-center justify-center p-1.5 rounded border transition-all duration-200 ease-in-out";
export const TOOLBAR_BUTTON_HOVER =
  "hover:bg-primary hover:border-primary hover:text-white hover:shadow-md hover:scale-110 active:scale-95";
export const TOOLBAR_BUTTON_BASE = cn(
  TOOLBAR_BUTTON,
  TOOLBAR_BUTTON_HOVER,
  "bg-background border-border",
);
export const MARKER_ACTION_BUTTON =
  "flex items-center justify-center p-1 rounded border transition-all hover:bg-accent hover:border-accent-foreground bg-background border-border";

export const ALL_SHAPES = [
  { type: PlacementShapeType.CIRCLE, icon: Circle, label: "Circle" },
  { type: PlacementShapeType.RECTANGLE, icon: Square, label: "Rectangle" },
  { type: PlacementShapeType.ELLIPSE, icon: Circle, label: "Ellipse" },
  { type: PlacementShapeType.POLYGON, icon: Hexagon, label: "Polygon" },
  { type: PlacementShapeType.FREEFORM, icon: PenTool, label: "Freeform" },
  { type: PlacementShapeType.SOFA, icon: Armchair, label: "Sofa" },
  { type: PlacementShapeType.STAGE, icon: Presentation, label: "Stage" },
  { type: PlacementShapeType.SEAT, icon: Pill, label: "Seat" },
];

export const ALIGN_BUTTONS: Array<{
  id: ShapeToolboxAlign;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  separatorBefore?: boolean;
}> = [
  { id: "left", icon: AlignStartVertical, title: "Align left" },
  { id: "center", icon: AlignCenterVertical, title: "Align center" },
  { id: "right", icon: AlignEndVertical, title: "Align right" },
  { id: "top", icon: AlignStartHorizontal, title: "Align top" },
  { id: "middle", icon: AlignCenterHorizontal, title: "Align middle" },
  { id: "bottom", icon: AlignEndHorizontal, title: "Align bottom" },
  {
    id: "space-between-h",
    icon: AlignHorizontalSpaceBetween,
    title: "Space between horizontally",
    separatorBefore: true,
  },
  {
    id: "space-between-v",
    icon: AlignVerticalSpaceBetween,
    title: "Space between vertically",
  },
  {
    id: "space-between-both",
    icon: LayoutTemplate,
    title: "Spread (space between horizontally and vertically)",
  },
  { id: "same-width", icon: RectangleHorizontal, title: "Same width" },
  { id: "same-height", icon: RectangleVertical, title: "Same height" },
];
