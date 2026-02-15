import type { PlacementShapeType, SeatMarker, SectionMarker } from "../../types";

export interface ShapeToolboxStyle {
  fillColor?: string;
  strokeColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
}

export type ShapeToolboxAlign =
  | "left"
  | "center"
  | "right"
  | "top"
  | "middle"
  | "bottom"
  | "space-between-h"
  | "space-between-v"
  | "space-between-both"
  | "same-width"
  | "same-height";

export interface ShapeToolboxProps {
  shape: {
    selectedShapeType: PlacementShapeType | null;
    onShapeTypeSelect: (shapeType: PlacementShapeType | null) => void;
  };
  selection: {
    selectedSeat?: SeatMarker | null;
    selectedSection?: SectionMarker | null;
    selectedSeatCount?: number;
    selectedSectionCount?: number;
  };
  actions: {
    onSeatEdit?: (seat: SeatMarker) => void;
    onSeatView?: (seat: SeatMarker) => void;
    onSectionEdit?: (section: SectionMarker) => void;
    onSectionView?: (section: SectionMarker) => void;
    onSeatDelete?: (seat: SeatMarker) => void;
    onSectionDelete?: (section: SectionMarker) => void;
  };
  styleActions: {
    onSeatShapeStyleChange?: (
      seatId: string,
      style: ShapeToolboxStyle,
    ) => void;
    onSectionShapeStyleChange?: (
      sectionId: string,
      style: ShapeToolboxStyle,
    ) => void;
    onAlign?: (alignment: ShapeToolboxAlign) => void;
  };
  layout?: {
    seatPlacementControls?: React.ReactNode;
    seatEditControls?: React.ReactNode;
    className?: string;
  };
  readOnly?: boolean;
  level?: "seat" | "section";
}
